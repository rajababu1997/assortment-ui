import { Suspense, useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { SpinnerCenter } from '@/components/primitives';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useTheme } from '@/hooks/useTheme';
import { useBreakpoint } from '@/hooks/useMediaQuery';
import { environment } from '@/config/environment';
import { Menu, Minimize } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Authenticated layout — used for all protected pages.
 *
 * Structure:
 *   Sidebar (left, permanent on desktop / overlay on mobile)
 *   — Bell + UserMenu live inside sidebar footer
 *   + Main area (right): scrollable content + footer
 *
 * Fullscreen mode: hides sidebar + footer, shows floating exit button.
 */
export function AuthenticatedLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { sidebarCollapsed, fullscreenMode, toggleFullscreenMode } = useTheme();
  const { isLg } = useBreakpoint();
  const isFullHeightPage = false;

  // Expose current sidebar offset as a CSS variable on :root so dialog masks can respect it
  const sidebarOffset = fullscreenMode
    ? '0px'
    : isLg
      ? sidebarCollapsed
        ? 'var(--sidebar-collapsed)'
        : 'var(--sidebar-width)'
      : '0px';

  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-offset', sidebarOffset);
    return () => {
      document.documentElement.style.removeProperty('--sidebar-offset');
    };
  }, [sidebarOffset]);

  return (
    <div className="flex h-screen">
      {/* Sidebar — hidden in fullscreen mode */}
      {!fullscreenMode && <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />}

      {/* Main area — offset by sidebar width on desktop (no offset in fullscreen) */}
      <div
        className="flex h-screen min-h-0 min-w-0 flex-1 flex-col"
        style={
          isLg && !fullscreenMode
            ? {
                marginLeft: sidebarCollapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)',
                transition: 'margin-left var(--transition-sidebar) cubic-bezier(0.4, 0, 0.2, 1)',
              }
            : fullscreenMode
              ? { marginLeft: 0, transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }
              : undefined
        }
      >
        {/* Mobile hamburger — hidden in fullscreen */}
        {!isLg && !fullscreenMode && (
          <div className="flex h-10 shrink-0 items-center border-b border-divider bg-surface px-3">
            <button
              onClick={() => setMobileOpen((prev) => !prev)}
              className="rounded p-1 text-on-secondary transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
              aria-label="Toggle menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Page content — main is the scroll container */}
        <main
          className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto dark:bg-[var(--p-surface-900)]"
          style={{ background: '#F8FAFC', padding: isFullHeightPage ? '0.5rem 0.75rem 0' : '0.75rem' }}
        >
          <Suspense fallback={<SpinnerCenter />}>
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </Suspense>
        </main>

        {/* Footer — hidden in fullscreen */}
        {!fullscreenMode && !isFullHeightPage && (
          <footer className="flex shrink-0 items-center justify-between border-t border-divider bg-surface px-4 py-1 lg:px-6 print:hidden">
            <span className="text-xs text-on-secondary">Copyright &copy; {environment.copyrights}</span>
          </footer>
        )}
      </div>

      {/* ── Floating exit-fullscreen button (bottom-left) ────────────────── */}
      <AnimatePresence>
        {fullscreenMode && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            onClick={toggleFullscreenMode}
            className="bg-surface/90 fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full border border-divider px-3 py-2 text-sm text-on shadow-lg backdrop-blur-sm transition-colors hover:bg-surface"
            title="Exit fullscreen"
          >
            <Minimize className="h-4 w-4" />
            <span className="hidden sm:inline">Exit Fullscreen</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
