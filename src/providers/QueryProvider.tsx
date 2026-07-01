/**
 * TanStack Query provider — all defaults OFF (behaves like Angular).
 *
 * Every navigation = fresh API call, no magic.
 * Caching / retry / background refresh = opt-in per call only.
 *
 * Global error surfacing: any failed query / mutation shows a toast so the
 * buyer never sees a silent failure. Individual components can still handle
 * errors locally — the global handler adds a toast on top, it doesn't
 * replace their own handling.
 */

import { type ReactNode } from 'react';
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import type { ApiError } from '@/lib/apiErrorHandler';
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

/** Best-effort extraction of a human message from any error shape. */
function messageOf(error: unknown): string {
  if (!error) return 'Something went wrong';
  const e = error as Partial<ApiError> & { message?: string };
  if (typeof e.message === 'string' && e.message.length > 0) return e.message;
  return 'Something went wrong';
}

/** Suppress toasts for expected auth flows (interceptor already retries). */
function shouldSuppress(error: unknown): boolean {
  const e = error as Partial<ApiError>;
  // 401 is handled by the axios interceptor (silent refresh + redirect).
  if (e?.status === 401) return true;
  return false;
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (shouldSuppress(error)) return;
      toast.error(messageOf(error));
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      if (shouldSuppress(error)) return;
      toast.error(messageOf(error));
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 0,                  // no caching by default
      retry: false,                  // no retry by default
      refetchOnWindowFocus: false,   // no background refresh
      gcTime: 0,                     // no keeping old data
    },
    mutations: {
      retry: false,
    },
  },
});

interface Props {
  children: ReactNode;
}

export function QueryProvider({ children }: Props) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />} */}
    </QueryClientProvider>
  );
}
