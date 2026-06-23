import { Suspense, createElement } from 'react';
import { Route } from 'react-router-dom';
import { routes } from './routeConfig';

function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export function useDynamicRoutes(layout: 'authenticated' | 'fullscreen') {
  return routes
    .filter((r) => r.layout === layout)
    .map((r) =>
      createElement(Route, {
        key: r.path,
        path: r.path,
        element: createElement(Suspense, { fallback: createElement(PageLoader) }, createElement(r.component)),
      })
    );
}
