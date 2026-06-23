import type { ComponentType } from 'react';
import type { FieldType, FieldProps } from '../tpsFormInterfaceTypes';
import { TpsTextField } from './TpsTextField';
import { TpsNumberField } from './TpsNumberField';
import { TpsPasswordField } from './TpsPasswordField';
import { TpsTextAreaField } from './TpsTextAreaField';
import { TpsSingleSelectField } from './TpsSingleSelectField';
import { TpsMultiSelectField } from './TpsMultiSelectField';
import { TpsCheckboxField } from './TpsCheckboxField';
import { TpsRadioField } from './TpsRadioField';
import { TpsDatePickerField } from './TpsDatePickerField';
import { TpsToggleSwitchField } from './TpsToggleSwitchField';
import { TpsSliderField } from './TpsSliderField';
import { TpsToggleButtonField } from './TpsToggleButtonField';
import { TpsSelectedButtonField } from './TpsSelectedButtonField';
import { TpsSegmentedControlField } from './TpsSegmentedControlField';
import { TpsTextSearchField } from './TpsTextSearchField';
import { TpsMultiFormField } from './TpsMultiFormField';

// ── Field Component Registry ───────────────────────────────────────────────
// Maps FieldType → React component. TpsForm does a simple lookup:
//   const Component = FIELD_MAP[field.type]

export const FIELD_MAP: Record<FieldType, ComponentType<FieldProps>> = {
  'text': TpsTextField,
  'number': TpsNumberField,
  'password': TpsPasswordField,
  'textarea': TpsTextAreaField,
  'single-select': TpsSingleSelectField,
  'multi-select': TpsMultiSelectField,
  'checkbox': TpsCheckboxField,
  'radio': TpsRadioField,
  'date': TpsDatePickerField,
  'toggle-switch': TpsToggleSwitchField,
  'slider': TpsSliderField,
  'toggle-button': TpsToggleButtonField,
  'selected-button': TpsSelectedButtonField,
  'segmented-control': TpsSegmentedControlField,
  'text-search': TpsTextSearchField,
  'multi-form-field': TpsMultiFormField,
};

// Re-export all field components
export { TpsTextField } from './TpsTextField';
export { TpsNumberField } from './TpsNumberField';
export { TpsPasswordField } from './TpsPasswordField';
export { TpsTextAreaField } from './TpsTextAreaField';
export { TpsSingleSelectField } from './TpsSingleSelectField';
export { TpsMultiSelectField } from './TpsMultiSelectField';
export { TpsCheckboxField } from './TpsCheckboxField';
export { TpsRadioField } from './TpsRadioField';
export { TpsDatePickerField } from './TpsDatePickerField';
export { TpsToggleSwitchField } from './TpsToggleSwitchField';
export { TpsSliderField } from './TpsSliderField';
export { TpsToggleButtonField } from './TpsToggleButtonField';
export { TpsSelectedButtonField } from './TpsSelectedButtonField';
export { TpsSegmentedControlField } from './TpsSegmentedControlField';
export { TpsTextSearchField } from './TpsTextSearchField';
export { TpsMultiFormField } from './TpsMultiFormField';
export { TpsFieldWrapper } from './TpsFieldWrapper';
export { TpsFieldError } from './TpsFieldError';
