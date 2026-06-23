import { AlertCircle } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';

/** Resolve a dot-path like "ruleFragments.0.column" from a nested object. */
export function getByPath(obj: Record<string, any>, path: string): any {
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

interface FieldErrorProps {
  fieldName: string;
  label: string;
  form: UseFormReturn<any>;
}

export function TpsFieldError({ fieldName, form }: FieldErrorProps) {
  const { errors, touchedFields, dirtyFields } = form.formState;
  const error = getByPath(errors, fieldName);
  const isTouched = getByPath(touchedFields, fieldName);
  const isDirty = getByPath(dirtyFields, fieldName);

  const showError = !!error && (isTouched || isDirty);

  return (
    <AnimatePresence>
      {showError && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.12, ease: [0.4, 0, 0.2, 1] }}
          className="text-[0.875rem] leading-tight text-[var(--color-danger)] mt-[0.125rem] flex items-center gap-1 overflow-hidden"
        >
          <AlertCircle size={16} strokeWidth={2} className="text-[0.625rem] flex-shrink-0" />
          <span>{error.message as string}</span>
        </motion.p>
      )}
    </AnimatePresence>
  );
}
