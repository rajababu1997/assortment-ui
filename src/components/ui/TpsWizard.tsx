import { Check, ArrowLeft, type LucideIcon } from 'lucide-react';
import { useState, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/primitives';

// ── Types ────────────────────────────────────────────────────────────────────

export interface WizardStepConfig {
  id: string;
  title: string;
  icon?: LucideIcon;
  optional?: boolean;
}

export interface WizardStepProps<T = Record<string, any>> {
  data: T;
  onUpdate: (partial: Partial<T>) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  isLastStep: boolean;
  stepIndex: number;
  /** Register footer action buttons (right side). Called from step via useEffect. */
  setFooter: (node: ReactNode) => void;
}

interface TpsWizardProps<T = Record<string, any>> {
  steps: WizardStepConfig[];
  renderStep: (step: WizardStepConfig, props: WizardStepProps<T>) => ReactNode;
  initialData?: T;
  onComplete?: (data: T) => void;
  onCancel?: () => void;
  orientation?: 'horizontal' | 'vertical';
}

// ── Animations ───────────────────────────────────────────────────────────────

const horizontalVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

const verticalVariants = {
  enter: (dir: number) => ({ y: dir > 0 ? 24 : -24, opacity: 0 }),
  center: { y: 0, opacity: 1 },
  exit: (dir: number) => ({ y: dir > 0 ? -24 : 24, opacity: 0 }),
};

// ── Component ────────────────────────────────────────────────────────────────

export function TpsWizard<T extends Record<string, any> = Record<string, any>>({
  steps,
  renderStep,
  initialData = {} as T,
  onComplete,
  onCancel,
  orientation = 'horizontal',
}: TpsWizardProps<T>) {
  const [currentStep, setCurrentStep] = useState(0);
  const [wizardData, setWizardData] = useState<T>(initialData);
  const [direction, setDirection] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [footerSlot, setFooterSlot] = useState<ReactNode>(null);

  const handleUpdate = useCallback((partial: Partial<T>) => {
    setWizardData((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleNext = useCallback(() => {
    setCompletedSteps((prev) => new Set(prev).add(currentStep));
    if (currentStep < steps.length - 1) {
      setDirection(1);
      setCurrentStep((s) => s + 1);
    } else {
      onComplete?.(wizardData);
    }
  }, [currentStep, steps.length, onComplete, wizardData]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((s) => s - 1);
    } else {
      onCancel?.();
    }
  }, [currentStep, onCancel]);

  const handleSkip = useCallback(() => {
    if (steps[currentStep]?.optional) {
      setDirection(1);
      setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
    }
  }, [currentStep, steps]);

  const goToStep = useCallback((idx: number) => {
    setDirection(idx > currentStep ? 1 : -1);
    setCurrentStep(idx);
  }, [currentStep]);

  const stepProps: WizardStepProps<T> = {
    data: wizardData,
    onUpdate: handleUpdate,
    onNext: handleNext,
    onBack: handleBack,
    onSkip: handleSkip,
    isLastStep: currentStep === steps.length - 1,
    stepIndex: currentStep,
    setFooter: setFooterSlot,
  };

  const variants = orientation === 'vertical' ? verticalVariants : horizontalVariants;

  if (orientation === 'vertical') {
    return (
      <div className="flex flex-col h-full min-h-0" style={{ fontSize: 14 }}>

        {/* ── Main area: sidebar + scrollable content ───────────────────── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* ── Sidebar ─────────────────────────────────────────────────── */}
          <div
            className="shrink-0 flex flex-col overflow-y-auto"
            style={{
              width: 220,
              background: 'var(--color-surface-dim)',
              borderRight: '1px solid var(--color-divider)',
              padding: '20px 12px',
            }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-4 px-2"
              style={{ color: 'var(--color-text-tertiary)' }}>
              Step {currentStep + 1} of {steps.length}
            </p>

            {steps.map((step, idx) => {
              const isActive    = idx === currentStep;
              const isPast      = idx < currentStep;
              const isCompleted = completedSteps.has(idx) || isPast;
              const StepIcon    = step.icon;
              const isLast      = idx === steps.length - 1;

              const isFuture = idx > currentStep && !completedSteps.has(idx);

              return (
                <div key={step.id} className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => !isFuture && goToStep(idx)}
                    disabled={isFuture}
                    className="flex items-center gap-3 text-left border-none transition-all duration-200 rounded-xl"
                    style={{
                      cursor: isFuture ? 'not-allowed' : 'pointer',
                      padding: '8px 10px',
                      background: isActive ? 'var(--color-primary-50)' : 'transparent',
                      outline: isActive ? `1.5px solid color-mix(in srgb, var(--color-primary) 25%, transparent)` : 'none',
                      opacity: isFuture ? 0.5 : 1,
                    }}
                  >
                    <div
                      className="shrink-0 flex items-center justify-center rounded-full text-[11px] font-bold transition-all duration-300"
                      style={{
                        width: 26, height: 26,
                        background: isActive
                          ? 'var(--color-primary)'
                          : isCompleted
                            ? 'var(--color-success)'
                            : 'var(--color-neutral-200)',
                        color: isActive || isCompleted ? 'white' : 'var(--color-text-tertiary)',
                        boxShadow: isActive ? '0 2px 6px color-mix(in srgb, var(--color-primary) 40%, transparent)' : 'none',
                      }}
                    >
                      {isCompleted && !isActive ? (
                        <Check size={12} strokeWidth={2.5} />
                      ) : StepIcon ? (
                        <StepIcon size={12} strokeWidth={2} />
                      ) : (
                        idx + 1
                      )}
                    </div>

                    <div className="flex flex-col min-w-0 flex-1">
                      <span
                        className="text-xs font-semibold leading-tight truncate transition-colors duration-200"
                        style={{
                          color: isActive
                            ? 'var(--color-primary)'
                            : isCompleted
                              ? 'var(--color-success-700)'
                              : 'var(--color-text-secondary)',
                        }}
                      >
                        {step.title}
                      </span>
                      {step.optional && (
                        <span className="text-[10px] leading-tight" style={{ color: 'var(--color-text-tertiary)' }}>
                          Optional
                        </span>
                      )}
                    </div>

                    {isActive && (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
                        <path d="M5 3l4 4-4 4" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>

                  {!isLast && (
                    <div style={{ paddingLeft: 22, paddingTop: 2, paddingBottom: 2 }}>
                      <div className="relative" style={{ width: 2, height: 16, background: 'var(--color-divider)', borderRadius: 1 }}>
                        <motion.div
                          className="absolute inset-x-0 top-0 rounded-full"
                          style={{ background: 'var(--color-success)' }}
                          initial={{ height: '0%' }}
                          animate={{ height: isPast ? '100%' : '0%' }}
                          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Step Content (scrollable) ────────────────────────────────── */}
          <div className="flex-1 min-w-0 overflow-y-auto" style={{ padding: 'var(--space-5) var(--space-6) var(--space-6)' }}>
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              >
                {renderStep(steps[currentStep], stepProps)}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ── Footer bar — Back (left) | step actions (right) ──────────── */}
        <div
          className="shrink-0 flex items-center justify-between px-5 py-3"
          style={{ borderTop: '1px solid var(--color-divider)', background: 'var(--color-surface)' }}
        >
          <Button
            variant="secondary"
            size="md"
            leftIcon={<ArrowLeft size={14} strokeWidth={2} />}
            onClick={handleBack}
          >
            Back
          </Button>
          <div className="flex items-center gap-2">
            {footerSlot}
          </div>
        </div>
      </div>
    );
  }

  // ── Horizontal layout (default) ──────────────────────────────────────────
  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ── Horizontal Stepper Bar ─────────────────────────────────────── */}
      <div className="shrink-0 px-6 pt-4 pb-3 border-b border-[var(--color-divider)] bg-[var(--color-surface)]">
        <div className="flex items-center">
          {steps.map((step, idx) => {
            const isActive    = idx === currentStep;
            const isPast      = idx < currentStep;
            const isCompleted = completedSteps.has(idx) || isPast;

            return (
              <div key={step.id} className="flex items-center" style={{ flex: idx < steps.length - 1 ? 1 : 'none' }}>
                <button
                  type="button"
                  className="flex items-center gap-2 shrink-0 bg-transparent border-none p-0 cursor-pointer"
                  onClick={() => goToStep(idx)}
                  title={step.title}
                >
                  <div className={`
                    flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0
                    transition-all duration-300 ease-out
                    ${isActive
                      ? 'bg-[var(--color-primary)] text-white shadow-md scale-110'
                      : isCompleted
                        ? 'bg-[var(--color-success)] text-white hover:scale-110'
                        : 'bg-[var(--color-neutral-200)] text-[var(--color-text-tertiary)]'
                    }
                  `}>
                    {isCompleted && !isActive ? (
                      <Check size={14} strokeWidth={2.5} />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <span className={`text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
                    isActive ? 'text-[var(--color-primary)]' : isCompleted ? 'text-[var(--color-success)]' : 'text-[var(--color-text-tertiary)]'
                  }`}>
                    {step.title}
                  </span>
                </button>

                {idx < steps.length - 1 && (
                  <div className="flex-1 mx-3 h-[2px] relative">
                    <div className="absolute inset-0 bg-[var(--color-divider)] rounded-full" />
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{ background: 'var(--color-success)' }}
                      initial={{ width: '0%' }}
                      animate={{ width: isPast ? '100%' : '0%' }}
                      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Step Content ───────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
            {renderStep(steps[currentStep], stepProps)}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
