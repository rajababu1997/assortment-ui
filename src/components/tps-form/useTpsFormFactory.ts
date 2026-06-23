import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type {
  FormSchema,
  FormFactoryOptions,
  FormFactoryReturn,
  ResolvedField,
  FieldSchema,
  ValidationRules,
  FieldOption,
} from './tpsFormInterfaceTypes';
import { FIELD_TYPES, FORM_MODES } from './constants';

// ── Helper: build default values for one row of a multi-form-field ────────
function buildRowDefaults(controls?: FormSchema): Record<string, any> {
  if (!controls) return {};
  const row: Record<string, any> = {};
  for (const [key, sub] of Object.entries(controls)) {
    if (sub.type === FIELD_TYPES.CHECKBOX || sub.type === FIELD_TYPES.TOGGLE_SWITCH || sub.type === FIELD_TYPES.TOGGLE_BUTTON) {
      row[key] = false;
    } else if (sub.type === FIELD_TYPES.MULTI_SELECT) {
      row[key] = [];
    } else {
      row[key] = sub.value ?? '';
    }
  }
  return row;
}

// ── Build Zod schema from field rules ──────────────────────────────────────

function buildZodField(field: FieldSchema & { fieldName: string }): z.ZodTypeAny {
  const { type, rules, label } = field;
  const isNumeric = type === FIELD_TYPES.NUMBER || type === FIELD_TYPES.SLIDER;
  const isBoolean = type === FIELD_TYPES.CHECKBOX || type === FIELD_TYPES.TOGGLE_SWITCH || type === FIELD_TYPES.TOGGLE_BUTTON;

  if (isBoolean) {
    return rules?.required
      ? z.boolean({ required_error: `${label} is required` })
      : z.boolean().optional();
  }

  if (isNumeric) {
    let schema = z.coerce.number({ invalid_type_error: `${label} must be a number` });
    if (rules?.min !== undefined) schema = schema.min(rules.min, `${label} must be at least ${rules.min}`);
    if (rules?.max !== undefined) schema = schema.max(rules.max, `${label} must not exceed ${rules.max}`);
    if (!rules?.required) return schema.optional().or(z.literal('').transform(() => undefined));
    return schema;
  }

  if (type === FIELD_TYPES.DATE) {
    if (rules?.required) return z.any().refine((v) => v != null && v !== '', { message: `${label} is required` });
    return z.any().optional();
  }

  if (type === FIELD_TYPES.MULTI_SELECT) {
    if (rules?.required) return z.array(z.any()).min(1, `${label} is required`);
    return z.array(z.any()).optional();
  }

  // Radio / selected-button — values can be string or number, use z.any()
  if (type === FIELD_TYPES.RADIO || type === FIELD_TYPES.SELECTED_BUTTON) {
    if (rules?.required) return z.any().refine((v) => v != null && v !== '', { message: `${label} is required` });
    return z.any().optional();
  }

  // Multi-form-field — nested array of sub-form rows
  if (type === FIELD_TYPES.MULTI_FORM_FIELD && (field as any).controls) {
    const controls = (field as any).controls as FormSchema;
    const rowShape: Record<string, z.ZodTypeAny> = {};
    for (const [key, subField] of Object.entries(controls)) {
      rowShape[key] = buildZodField({ ...subField, fieldName: key });
    }
    return z.array(z.object(rowShape)).optional();
  }

  // String-based fields (text, password, textarea, single-select, text-search)
  let strSchema = z.string();
  if (rules?.required) {
    strSchema = strSchema.min(1, `${label} is required`);
  }
  if (rules?.minLength) {
    strSchema = strSchema.min(rules.minLength, `${label} must be at least ${rules.minLength} characters`);
  }
  if (rules?.maxLength) {
    strSchema = strSchema.max(rules.maxLength, `${label} must not exceed ${rules.maxLength} characters`);
  }
  if (rules?.pattern) {
    strSchema = strSchema.regex(new RegExp(rules.pattern), `${label} is invalid`);
  }

  if (!rules?.required) return strSchema.optional().or(z.literal(''));
  return strSchema;
}

function buildZodSchema(fields: ResolvedField[]): z.ZodObject<any> {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of fields) {
    if (field.show === false) continue;
    shape[field.fieldName] = buildZodField(field);
  }
  return z.object(shape);
}

// ── Build default values from schema ───────────────────────────────────────

function buildDefaults(fields: ResolvedField[]): Record<string, any> {
  const defaults: Record<string, any> = {};
  for (const f of fields) {
    if (f.type === FIELD_TYPES.MULTI_FORM_FIELD) {
      defaults[f.fieldName] = [buildRowDefaults(f.controls)];
    } else if (f.value !== undefined) {
      defaults[f.fieldName] = f.value;
    } else if (f.type === FIELD_TYPES.CHECKBOX || f.type === FIELD_TYPES.TOGGLE_SWITCH || f.type === FIELD_TYPES.TOGGLE_BUTTON) {
      defaults[f.fieldName] = false;
    } else if (f.type === FIELD_TYPES.MULTI_SELECT) {
      defaults[f.fieldName] = [];
    } else if (f.type === FIELD_TYPES.NUMBER || f.type === FIELD_TYPES.SLIDER) {
      defaults[f.fieldName] = '';
    } else {
      defaults[f.fieldName] = '';
    }
  }
  return defaults;
}

// ── Resolve FormSchema → ResolvedField[] ───────────────────────────────────

function resolveFields(schema: FormSchema): ResolvedField[] {
  return Object.entries(schema).map(([key, field]) => ({
    ...field,
    fieldName: key,
    show: field.show !== false,
  }));
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useTpsFormFactory(
  schema: FormSchema,
  options: FormFactoryOptions
): FormFactoryReturn {
  const { mode } = options;

  const [fieldsState, setFieldsState] = useState<ResolvedField[]>(() =>
    resolveFields(schema)
  );
  const fieldsStateRef = useRef(fieldsState);

  // Re-resolve fields when schema changes (e.g. switching between create/edit mode)
  useEffect(() => {
    setFieldsState(resolveFields(schema));
  }, [schema]);

  useEffect(() => {
    fieldsStateRef.current = fieldsState;
  }, [fieldsState]);

  const zodSchema = useMemo(() => buildZodSchema(fieldsState), [fieldsState]);

  const form = useForm({
    resolver: zodResolver(zodSchema),
    defaultValues: buildDefaults(fieldsState),
    mode: 'onTouched',
  });

  // Keep a stable ref to form so callbacks don't depend on form identity
  const formRef = useRef(form);
  formRef.current = form;

  // ── setOptions: dynamically populate dropdown/select ───────────────────
  const setOptions = useCallback(
    (fieldName: string, options: FieldOption[]) => {
      setFieldsState((prev) =>
        prev.map((f) => (f.fieldName === fieldName ? { ...f, options } : f))
      );
    },
    []
  );

  // ── showField: toggle field visibility ─────────────────────────────────
  const showField = useCallback(
    (fieldName: string, visible: boolean) => {
      setFieldsState((prev) =>
        prev.map((f) => (f.fieldName === fieldName ? { ...f, show: visible } : f))
      );
    },
    []
  );

  // ── setControlOptions: update options for a sub-field inside a multi-form-field
  const setControlOptions = useCallback(
    (fieldName: string, controlName: string, options: FieldOption[]) => {
      setFieldsState((prev) =>
        prev.map((f) => {
          if (f.fieldName !== fieldName || !f.controls) return f;
          return {
            ...f,
            controls: {
              ...f.controls,
              [controlName]: { ...f.controls[controlName], options },
            },
          };
        })
      );
    },
    []
  );

  // ── showControl: toggle visibility of a sub-field inside a multi-form-field
  const showControl = useCallback(
    (fieldName: string, controlName: string, visible: boolean) => {
      setFieldsState((prev) =>
        prev.map((f) => {
          if (f.fieldName !== fieldName || !f.controls) return f;
          return {
            ...f,
            controls: {
              ...f.controls,
              [controlName]: { ...f.controls[controlName], show: visible },
            },
          };
        })
      );
    },
    []
  );

  // ── setFieldRules: update validation rules dynamically ─────────────────
  const setFieldRules = useCallback(
    (fieldName: string, rules: ValidationRules) => {
      setFieldsState((prev) =>
        prev.map((f) =>
          f.fieldName === fieldName
            ? { ...f, rules: { ...f.rules, ...rules } }
            : f
        )
      );
    },
    []
  );

  // ── populateForm: reset form state + set ALL field values (mirrors Angular setFormControlsValues) ──
  const populateForm = useCallback(
    (data: Record<string, any>) => {
      const currentFields = fieldsStateRef.current;

      // Build values object with defaults for missing fields
      const values: Record<string, any> = {};
      for (const field of currentFields) {
        const val = data[field.fieldName];
        const defaultVal = field.value !== undefined ? field.value
          : field.type === FIELD_TYPES.MULTI_SELECT ? []
          : (field.type === FIELD_TYPES.CHECKBOX || field.type === FIELD_TYPES.TOGGLE_SWITCH || field.type === FIELD_TYPES.TOGGLE_BUTTON) ? false
          : '';

        if (field.type === FIELD_TYPES.MULTI_FORM_FIELD) {
          values[field.fieldName] = Array.isArray(val) && val.length > 0
            ? val
            : [buildRowDefaults(field.controls)];
        } else if (val != null && field.type === FIELD_TYPES.DATE && typeof val === 'number') {
          values[field.fieldName] = new Date(val);
        } else if (
          val != null &&
          [
            FIELD_TYPES.TEXT,
            FIELD_TYPES.PASSWORD,
            FIELD_TYPES.TEXTAREA,
            FIELD_TYPES.SINGLE_SELECT,
            FIELD_TYPES.TEXT_SEARCH,
          ].includes(field.type) &&
          typeof val !== 'string'
        ) {
          values[field.fieldName] = String(val);
        } else {
          values[field.fieldName] = val ?? defaultVal;
        }
      }
      // Reset clears touched/dirty/errors state, then sets new values
      formRef.current.reset(values);
      void formRef.current.trigger();
    },
    // Stable: formRef never changes identity, fieldsStateRef never changes identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // ── toPayload: extract form values as plain object ─────────────────────
  const toPayload = useCallback((): Record<string, any> => {
    const values = formRef.current.getValues();
    const payload: Record<string, any> = {};
    const currentFields = fieldsStateRef.current;

    for (const field of currentFields) {
      const val = values[field.fieldName];
      if (field.type === FIELD_TYPES.MULTI_FORM_FIELD) {
        payload[field.fieldName] = Array.isArray(val) ? val : [];
      } else if (field.type === FIELD_TYPES.DATE && val instanceof Date) {
        payload[field.fieldName] = +val; // Date → timestamp (ms)
      } else {
        payload[field.fieldName] = val;
      }
    }

    return payload;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // In view mode, disable all fields
  const resolvedFields = useMemo(() => {
    if (mode !== FORM_MODES.VIEW) return fieldsState;
    return fieldsState.map((f) => ({ ...f, disabled: true }));
  }, [fieldsState, mode]);

  return {
    form,
    fields: resolvedFields,
    setOptions,
    setControlOptions,
    showControl,
    showField,
    setFieldRules,
    populateForm,
    toPayload,
  };
}
