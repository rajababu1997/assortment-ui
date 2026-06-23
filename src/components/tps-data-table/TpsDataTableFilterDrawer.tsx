import { SlidersHorizontal, X } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { Button, Drawer } from '@/components/primitives';
import { useWindowSize } from 'usehooks-ts';
import { TpsForm } from '@/components/tps-form/TpsForm';
import { useTpsFormFactory } from '@/components/tps-form/useTpsFormFactory';
import type { FilterFieldConfig } from './types';
import type { FormSchema } from '@/components/tps-form/tpsFormInterfaceTypes';
import { BREAKPOINT_PX } from './types';

interface DataTableFilterDrawerProps {
  open: boolean;
  onClose: () => void;
  filters: FilterFieldConfig[];
  values: Record<string, any>;
  onApply: (values: Record<string, any>) => void;
  onReset: () => void;
}

export function TpsDataTableFilterDrawer({
  open,
  onClose,
  filters,
  values,
  onApply,
  onReset,
}: DataTableFilterDrawerProps) {
  const { width = 1280 } = useWindowSize();
  const isMobile = width < BREAKPOINT_PX.md;

  const formSchema: FormSchema = useMemo(() => Object.fromEntries(
    filters.map((f) => [
      f.field,
      {
        type: f.type,
        label: f.label,
        placeholder: f.placeholder,
        options: f.options as any,
        value: values[f.field] ?? f.value,
        rules: f.rules,
      },
    ]),
  ), [filters, values]);

  const { form, fields } = useTpsFormFactory(formSchema, { mode: 'create' });

  const handleApply = useCallback(() => {
    const raw = form.getValues();
    const clean = Object.fromEntries(
      Object.entries(raw).filter(([, v]) => v != null && v !== ''),
    );
    onApply(clean);
    onClose();
  }, [form, onApply, onClose]);

  const handleReset = useCallback(() => {
    form.reset();
    onReset();
    onClose();
  }, [form, onReset, onClose]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      width={isMobile ? '100vw' : 380}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SlidersHorizontal size={16} strokeWidth={2} />
          <span>Advanced Filters</span>
        </div>
      }
      footer={
        <div style={{ display: 'flex', gap: 12 }}>
          <Button
            variant="secondary"
            fullWidth
            leftIcon={<X size={13} strokeWidth={2} />}
            onClick={handleReset}
          >
            Reset
          </Button>
          <Button
            variant="primary"
            fullWidth
            leftIcon={<SlidersHorizontal size={13} strokeWidth={2} />}
            onClick={handleApply}
          >
            Apply Filters
          </Button>
        </div>
      }
    >
      {filters.length === 0 ? (
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)', textAlign: 'center', padding: '32px 0' }}>
          No filters configured for this table.
        </p>
      ) : (
        <TpsForm form={form} fields={fields} mode="create" layout="column" />
      )}
    </Drawer>
  );
}
