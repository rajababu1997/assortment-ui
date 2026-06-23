import { toast } from '@/lib/toast';

/**
 * Hook wrapper around the global toast service.
 * Provides the same API as the direct import — use whichever is more convenient.
 *
 * Usage:
 *   const { showToast } = useToast();
 *   showToast.success('Saved!');
 *   showToast.error('Failed to save');
 */
export function useToast() {
  return { showToast: toast };
}
