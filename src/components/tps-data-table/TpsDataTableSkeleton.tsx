import { useRef, useState, useEffect } from 'react';
import { Skeleton } from '@/components/primitives';

const HEADER_HEIGHT = 34;
const ROW_HEIGHT = 36;
const FALLBACK_ROWS = 10;

interface DataTableSkeletonProps {
  rows?: number;
  columns?: number;
}

/**
 * Skeleton loader — dynamically fills available height via ResizeObserver.
 */
export function TpsDataTableSkeleton({ rows: fixedRows, columns = 5 }: DataTableSkeletonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dynamicRows, setDynamicRows] = useState(fixedRows ?? FALLBACK_ROWS);

  useEffect(() => {
    if (fixedRows != null) return;
    const el = containerRef.current;
    if (!el) return;

    const calc = () => {
      const h = el.getBoundingClientRect().height;
      if (h > 0) {
        const count = Math.max(3, Math.floor((h - HEADER_HEIGHT) / ROW_HEIGHT));
        setDynamicRows(count);
      }
    };

    // Try immediately
    calc();

    // Watch for layout changes
    const ro = new ResizeObserver(calc);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fixedRows]);

  const rowCount = fixedRows ?? dynamicRows;

  return (
    <div ref={containerRef} className="w-full flex-1 min-h-0 overflow-hidden">
      {/* Header row skeleton */}
      <div
        className="flex items-center gap-4 px-4"
        style={{ height: `${HEADER_HEIGHT}px`, background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}
      >
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} height={10} width="100%" className="flex-1" />
        ))}
      </div>

      {/* Data rows — fills visible area */}
      {Array.from({ length: rowCount }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="flex items-center gap-4 px-4"
          style={{
            height: `${ROW_HEIGHT}px`,
            borderBottom: '1px solid #f1f5f9',
          }}
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <Skeleton
              key={colIdx}
              height={10}
              width="100%"
              className="flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  );
}
