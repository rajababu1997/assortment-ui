/**
 * ConfirmationDialog — promise-based confirm dialog.
 *
 * Usage:
 *   const { confirm, ConfirmDialog } = useConfirmDialog();
 *   const ok = await confirm('Are you sure?');
 *   if (ok) { ... }
 *   // render <ConfirmDialog /> once in your JSX
 */
import { useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, HelpCircle } from 'lucide-react';
import { Button } from '@/components/primitives';

interface DialogState {
  visible: boolean;
  message: string;
  header: string;
}

type PromiseResolveFn = Parameters<ConstructorParameters<typeof Promise<boolean>>[0]>[0];

function createDeferred() {
  let resolveFn: PromiseResolveFn | null = null;
  const promise = new Promise<boolean>((r) => { resolveFn = r; });
  return { promise, resolve: resolveFn! };
}

export function useConfirmDialog() {
  const [state, setState] = useState<DialogState>({ visible: false, message: '', header: 'Confirmation' });
  const deferredRef = useRef<ReturnType<typeof createDeferred> | null>(null);

  const confirm = useCallback((message: string, header = 'Confirmation'): Promise<boolean> => {
    if (deferredRef.current) deferredRef.current.resolve(false);
    const deferred = createDeferred();
    deferredRef.current = deferred;
    setState({ visible: true, message, header });
    return deferred.promise;
  }, []);

  const close = useCallback((result: boolean) => {
    setState((prev) => ({ ...prev, visible: false }));
    if (deferredRef.current) {
      deferredRef.current.resolve(result);
      deferredRef.current = null;
    }
  }, []);

  const ConfirmDialog = useCallback(
    () =>
      createPortal(
        <AnimatePresence>
          {state.visible && (
            <>
              {/* Backdrop */}
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                style={{
                  position: 'fixed', inset: 0,
                  background: 'var(--color-overlay)',
                  backdropFilter: 'blur(2px)',
                  zIndex: 'var(--z-modal)',
                }}
                onClick={() => close(false)}
              />

              {/* Card */}
              <div style={{
                position: 'fixed', inset: 0,
                zIndex: 'calc(var(--z-modal) + 1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '16px', pointerEvents: 'none',
              }}>
                <motion.div
                  key="card"
                  initial={{ opacity: 0, scale: 0.93, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 4 }}
                  transition={{ type: 'spring', damping: 28, stiffness: 380, mass: 0.8 }}
                  style={{ width: '100%', maxWidth: '420px', pointerEvents: 'auto' }}
                >
                  <div style={{
                    background: 'var(--color-surface)',
                    borderRadius: '16px',
                    border: '1px solid var(--color-divider)',
                    boxShadow: 'var(--shadow-xl)',
                    overflow: 'hidden',
                  }}>
                    {/* Header */}
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 20px',
                      borderBottom: '1px solid var(--color-divider)',
                    }}>
                      <span style={{
                        fontWeight: 600, fontSize: '0.9375rem',
                        color: 'var(--color-text)', letterSpacing: '-0.01em',
                      }}>
                        {state.header}
                      </span>
                      <button
                        onClick={() => close(false)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: '28px', height: '28px', borderRadius: '6px',
                          border: 'none', background: 'transparent',
                          cursor: 'pointer', color: 'var(--color-text-tertiary)',
                          transition: 'background 0.15s, color 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--color-hover)';
                          e.currentTarget.style.color = 'var(--color-text)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = 'var(--color-text-tertiary)';
                        }}
                        aria-label="Close"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {/* Body */}
                    <div style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      padding: '28px 32px 32px',
                    }}>
                      {/* Icon ring */}
                      <motion.div
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.08, type: 'spring', damping: 18, stiffness: 300 }}
                        style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}
                      >
                        <div style={{
                          position: 'absolute', inset: -6, borderRadius: '50%',
                          background: 'var(--color-primary-100)', opacity: 0.5,
                        }} />
                        <div style={{
                          position: 'absolute', inset: -3, borderRadius: '50%',
                          background: 'var(--color-primary-200)', opacity: 0.4,
                        }} />
                        <div style={{
                          position: 'relative', width: 72, height: 72, borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-700))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: '0 4px 12px rgba(30,136,220,0.3)',
                        }}>
                          <HelpCircle size={28} color="#fff" strokeWidth={2.5} />
                        </div>
                      </motion.div>

                      <motion.p
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.14, duration: 0.22 }}
                        style={{
                          fontWeight: 600, fontSize: '1.15rem', lineHeight: 1.4,
                          textAlign: 'center', marginTop: 20, marginBottom: 4,
                          color: 'var(--color-text)', maxWidth: 320, letterSpacing: '-0.01em',
                        }}
                      >
                        {state.message}
                      </motion.p>

                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.2 }}
                        style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 0 }}
                      >
                        Please confirm to proceed.
                      </motion.p>

                      <div style={{
                        width: '100%', height: 1,
                        background: 'var(--color-divider)',
                        margin: '24px 0',
                      }} />

                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.22, duration: 0.18 }}
                        style={{ display: 'flex', gap: 12, width: '100%', justifyContent: 'center' }}
                      >
                        <Button variant="secondary" onClick={() => close(false)}>Cancel</Button>
                        <Button variant="primary" onClick={() => close(true)}>Proceed</Button>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>,
        document.body,
      ),
    [state.visible, state.message, state.header, close],
  );

  return { confirm, ConfirmDialog };
}
