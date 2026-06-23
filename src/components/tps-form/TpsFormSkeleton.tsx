/**
 * TpsFormSkeleton — Loading skeleton that matches the form section card layout.
 * Use when form data is loading in edit/view mode.
 */

interface TpsFormSkeletonProps {
  /** Number of section cards to show */
  sections?: number;
  /** Number of field rows per section */
  fieldsPerSection?: number;
  /** Number of columns (1 or 2) */
  columns?: 1 | 2;
}

export function TpsFormSkeleton({
  sections = 3,
  fieldsPerSection = 4,
  columns = 2,
}: TpsFormSkeletonProps) {
  return (
    <div className="flex flex-col gap-5">
      {Array.from({ length: sections }).map((_, sIdx) => (
        <div key={sIdx} className="tps-form-section">
          {/* Skeleton section header */}
          <div className="tps-form-section__header">
            <div className="tps-form-section__icon opacity-40">
              <div className="w-4 h-4 rounded bg-[var(--color-divider)]" />
            </div>
            <div className="tps-form-skeleton-label" style={{ width: `${100 + sIdx * 20}px` }} />
          </div>

          {/* Skeleton fields */}
          <div className="tps-form-section__body">
            <div className="flex flex-wrap w-full justify-between">
              {Array.from({ length: fieldsPerSection }).map((_, fIdx) => (
                <div
                  key={fIdx}
                  className={`w-full mb-[0.75rem] ${columns === 2 ? 'md:w-[43%]' : 'md:w-full'}`}
                >
                  <div className="flex flex-col md:flex-row md:items-start gap-2">
                    <div className="md:w-[42%]">
                      <div className="tps-form-skeleton-label" style={{ width: `${60 + (fIdx % 3) * 20}%` }} />
                    </div>
                    <div className="md:w-[58%]">
                      <div className="tps-form-skeleton-field" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
