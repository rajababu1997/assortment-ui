import { Suspense, createElement } from 'react';
import { Route } from 'react-router-dom';
import { SpinnerCenter } from '@/components/primitives';
import { routes } from './routeConfig';

export function useDynamicRoutes(layout: 'authenticated' | 'fullscreen') {
  return routes
    .filter((r) => r.layout === layout)
    .map((r) =>
      createElement(Route, {
        key: r.path,
        path: r.path,
        element: createElement(Suspense, { fallback: createElement(SpinnerCenter) }, createElement(r.component)),
      })
    );
}
