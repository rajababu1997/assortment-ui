/**
 * TanStack Query provider — all defaults OFF (behaves like Angular).
 *
 * Every navigation = fresh API call, no magic.
 * Caching / retry / background refresh = opt-in per call only.
 */

import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
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
