import { Check } from 'lucide-react';
/**
 * TpsStepper — Reusable horizontal stepper component.
 *
 * Matches modern 2026 design: numbered circles with connecting lines,
 * labels below each circle, color-coded states (pending/active/completed).
 *
 * Usage:
 *   <TpsStepper
 *     steps={[{ key: 'info', label: 'Job Info' }, { key: 'images', label: 'Upload' }]}
 *     activeStep={0}
 *     onStepClick={idx => setStep(idx)}
 *     canClickStep={idx => idx === 0 || !!uuid}
 *   />
 */
import type { CSSProperties } from 'react';

export interface TpsStepperStep {
  /** Unique key for the step */
  key: string;
  /** Step label (shown below circle) */
  label: string;
}

export interface TpsStepperProps {
  /** Steps to display */
  steps: readonly TpsStepperStep[] | TpsStepperStep[];
  /** Current active step index (0-based) */
  activeStep: number;
  /** Called when a clickable step is clicked */
  onStepClick?: (idx: number) => void;
  /** Predicate to determine if a step can be clicked. Defaults: only completed + active are clickable */
  canClickStep?: (idx: number) => boolean;
  /** Max width of the stepper container (default: '100%' — fills parent) */
  maxWidth?: string;
  /** Custom primary color (default: var(--color-primary, #3b82f6)) */
  color?: string;
  /** Container className */
  className?: string;
  /** Container style override */
  style?: CSSProperties;
}

export function TpsStepper({
  steps,
  activeStep,
  onStepClick,
  canClickStep,
  maxWidth = '100%',
  color,
  className,
  style,
}: TpsStepperProps) {
  const accent = color ?? 'var(--color-primary, #3b82f6)';

  return (
    <div className={`tps-stepper ${className ?? ''}`} style={{ width: '100%', maxWidth, ...style }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
        {steps.map((step, idx) => {
          const isActive = idx === activeStep;
          const isCompleted = idx < activeStep;
          const defaultClickable = idx <= activeStep;
          const isClickable = canClickStep ? canClickStep(idx) : defaultClickable;
          const isLast = idx === steps.length - 1;

          const handleClick = () => {
            if (isClickable && onStepClick) onStepClick(idx);
          };

          return (
            <div
              key={step.key}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                flex: isLast ? '0 0 auto' : 1, minWidth: 0, position: 'relative',
              }}
            >
              {/* Circle + connector line row */}
              <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={handleClick}
                  aria-current={isActive ? 'step' : undefined}
                  style={{
                    width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0, padding: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isCompleted ? accent : '#fff',
                    color: isCompleted ? '#fff' : isActive ? accent : '#cbd5e1',
                    fontSize: '0.75rem', fontWeight: 700,
                    border: isCompleted
                      ? 'none'
                      : isActive
                        ? `2px solid ${accent}`
                        : '2px solid var(--surface-border, #e2e8f0)',
                    cursor: isClickable ? 'pointer' : 'not-allowed',
                    transition: 'all 0.25s ease',
                  }}
                >
                  {isCompleted ? <Check size={11} strokeWidth={2} /> : idx + 1}
                </button>

                {!isLast && (
                  <div style={{
                    flex: 1, height: '2px', margin: '0 0.5rem',
                    background: isCompleted ? accent : 'var(--surface-border, #e2e8f0)',
                    transition: 'background 0.25s ease',
                  }} />
                )}
              </div>

              {/* Label below circle */}
              <button
                type="button"
                disabled={!isClickable}
                onClick={handleClick}
                style={{
                  marginTop: '0.5rem', background: 'transparent', border: 'none', padding: 0,
                  cursor: isClickable ? 'pointer' : 'not-allowed',
                  fontSize: '0.8rem', fontWeight: 600,
                  color: isActive
                    ? accent
                    : isCompleted
                      ? 'var(--text-color, #0f172a)'
                      : '#94a3b8',
                  whiteSpace: 'nowrap',
                  transition: 'color 0.25s ease',
                }}
              >
                {step.label}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
