# CLAUDE.md

This file provides guidance to Claude Code when working with this UI boilerplate.

## Commands

```bash
npm run dev          # Dev server on http://localhost:5173
npm run build        # Type-check + production build → dist/
npm run type-check   # TypeScript check only
npm run lint         # ESLint (zero warnings)
npm run lint:fix     # ESLint auto-fix
npm run format       # Prettier
npm test             # Vitest single run
npm run test:e2e     # Playwright
```

Run a single test file:
```bash
npx vitest run src/path/to/file.test.ts
```

Husky runs `eslint --fix` + `prettier --write` on staged files at commit time.

## Environment Setup

All configuration comes from `.env.development` / `.env.production` — never edit `src/config/environment.ts` directly.

Required (app throws at startup if missing):
- `VITE_APP_TITLE`, `VITE_API_URL`, `VITE_TENANT_UID`

Auth: `VITE_AUTH_TYPE` = `BASIC` (default) | `KEYCLOAK` | `AWS_COGNITO`.

## Architecture

### App Shell
`main.tsx` → `App.tsx` → `BrowserRouter` → routes wrapped in `AppProviders` (Redux + Query + Theme).

Three layouts under `src/app/layout/`:
- `AuthenticatedLayout` — sidebar + topbar
- `FullscreenLayout` — minimal chrome
- `PublicLayout` — unauthenticated pages

`ProtectedRoute` guards authenticated routes; `GuestRoute` redirects logged-in users away from sign-in.

### Routing
Flat `RouteConfig[]` in `src/routes/routeConfig.ts`. Each entry has `path`, lazy `component`, and `layout`. `useDynamicRoutes()` converts these into React Router `<Route>` elements.

### State
- **Redux** (`src/store/`) — `authSlice` + `themeSlice`. Use typed `useAppSelector` / `useAppDispatch`.
- **TanStack Query** — server state, all defaults off (every navigation = fresh fetch).
- **Local state** — component UI state.

### API Layer
`src/services/invokeService.ts` exports 5 helpers (`invokeService`, `uploadService`, image fetch/base64, download). All go through `src/lib/axios.ts`:
- `apiClient` — `withCredentials: true`, injects `Authorization` + `Client` (tenantUid) headers, handles 401/403 with one silent refresh + retry queue.
- `edgeApiClient` — same auth but no credentials cookie.

Endpoints live in `src/constants/apiConfig.ts` as typed `ApiEndpoint` objects.

### Auth Strategies
`src/auth/authStrategyFactory.ts` returns a singleton `IAuthStrategy` selected by `VITE_AUTH_TYPE`. Three implementations: `BasicAuthStrategy`, `KeycloakStrategy`, `CognitoStrategy`. The Axios interceptor calls `getAuthStrategy()` — it never reads `VITE_AUTH_TYPE` directly.

### Feature Modules
All feature code lives under `src/features/<name>/`. Each is self-contained: components, hooks, API module, types. Current modules: `auth`, `profile`, `settings`, `landing`, `sample` (reference CRUD).

### Shared Components
- `tps-data-table/` — AG Grid wrapper with filters, export, mobile card fallback.
- `tps-form/` — schema-driven `DynamicForm` (15+ field types).
- `primitives/` — low-level UI primitives.
- `ui/` — shared composite components (PageHeader, buttons, dialogs, etc.).

### Styling
Tailwind + CSS custom properties. Never hardcode colours — use Tailwind classes backed by CSS variables. CSS layer order in `src/styles/globals.css` is critical: base → components → utilities. Light/dark via `dark` class on `<html>`; density via `density-compact` class.

### Path Aliases
`@/` maps to `src/` (configured in `vite.config.ts` and `tsconfig.json`). Always use `@/`, never relative `../../`.

## Conventions

- Forms: use `react-hook-form` + Zod for ad-hoc forms; use `DynamicForm` for schema-driven CRUD forms.
- Tables: use `tps-data-table`. Mobile card fallback is built in.
- API calls: always go through `invokeService` family — never raw `fetch` or `axios.create`.
- Storage: use `secureStorage` (AES-encrypted sessionStorage) via `STORAGE_KEYS` constants.
- Toasts: `import { toast } from '@/lib/toast'` for action results; `snackbar.warn()` for validation; `useConfirmDialog()` for destructive actions.
