import { memo, useState, useCallback, useImperativeHandle, forwardRef, useRef } from 'react';
import type { IFloatingFilterParams } from 'ag-grid-community';

export interface TpsDropdownFloatingFilterParams extends IFloatingFilterParams {
  options: { label: string; value: any }[];
}

const TpsDropdownFloatingFilter = memo(
  forwardRef<any, TpsDropdownFloatingFilterParams>(
    function TpsDropdownFloatingFilter(params, ref) {
      const [selectedValue, setSelectedValue] = useState<any>('');
      const containerRef = useRef<HTMLDivElement>(null);
      const options = (params as any).options ?? [];

      const onParentModelChanged = useCallback((parentModel: any) => {
        if (parentModel && parentModel.filter != null) {
          setSelectedValue(String(parentModel.filter));
        } else {
          setSelectedValue('');
        }
      }, []);

      useImperativeHandle(ref, () => ({
        onParentModelChanged,
        getModelAsString: () => selectedValue,
        getGui: () => containerRef.current!,
      }));

      const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLSelectElement>) => {
          const value = e.target.value;
          setSelectedValue(value);

          if (value !== '') {
            params.parentFilterInstance((filterInstance: any) => {
              filterInstance.setModel({ type: 'equals', filter: value });
            });
          } else {
            params.parentFilterInstance((filterInstance: any) => {
              filterInstance.setModel(null);
            });
          }
        },
        [params],
      );

      return (
        <div
          ref={containerRef}
          style={{ height: '100%', display: 'flex', alignItems: 'center', width: '100%', paddingRight: 4 }}
        >
          <select
            value={selectedValue}
            onChange={handleChange}
            style={{
              width: '100%', height: 32,
              padding: '0 8px',
              fontSize: '0.8125rem',
              border: '1px solid var(--color-border)',
              borderRadius: 6,
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="">Select…</option>
            {options.map((opt: { label: string; value: any }) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      );
    },
  ),
);

TpsDropdownFloatingFilter.displayName = 'TpsDropdownFloatingFilter';

export default TpsDropdownFloatingFilter;
