# UI Boilerplate

Opinionated React + TypeScript + Vite boilerplate. Drop-in starting point for any new UI project — auth, routing, layout, theming, table + form systems are already wired. Point it at a new backend by editing `.env`.

## Quick start

```bash
npm install
cp .env.development .env.development.local   # or edit directly
npm run dev
```

Open http://localhost:5173.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on :5173 |
| `npm run build` | Type-check + production build to `dist/` |
| `npm run type-check` | TypeScript check, no emit |
| `npm run lint` / `lint:fix` | ESLint (zero warnings) |
| `npm run format` | Prettier write |
| `npm test` / `test:watch` | Vitest |
| `npm run test:e2e` | Playwright |

Husky + lint-staged auto-format on commit.

## What's included

- **Auth** — `BASIC` (HTTP Basic), `KEYCLOAK` (OIDC password grant), `AWS_COGNITO` (Amplify v6). Switch via `VITE_AUTH_TYPE`.
- **Routing** — flat `routeConfig.ts`, lazy-loaded pages, `ProtectedRoute` + `GuestRoute` wrappers, three layouts (public, authenticated, fullscreen).
- **State** — Redux (auth + theme) + TanStack Query for server state (defaults off — every navigation = fresh fetch).
- **API layer** — `apiClient` + `edgeApiClient` Axios instances with token refresh queue; 5 service helpers (`invokeService`, `uploadService`, image fetch/base64, file download).
- **Theming** — Tailwind + CSS custom properties, light/dark, density toggle.
- **Shared components** — `tps-data-table` (AG Grid wrapper with filters/export/mobile cards), `tps-form` (schema-driven DynamicForm with 15+ field types), `primitives/`, `ui/`.
- **Generic pages** — Sign in / forgot / reset / sign out, profile, settings, home, sample CRUD, 404.
- **Sample feature** — `src/features/sample/` shows the full pattern: types, API module, list + edit page using TanStack Query.

## Environment variables

Edit `.env.development` and `.env.production`. Required (throws at startup if missing):

- `VITE_APP_TITLE`
- `VITE_API_URL`
- `VITE_TENANT_UID`

Optional but commonly set:

- `VITE_AUTH_TYPE` — `BASIC` (default) | `KEYCLOAK` | `AWS_COGNITO`
- `VITE_APP_SUBTITLE`, `VITE_POWERED_BY`, `VITE_COPYRIGHTS`, `VITE_LOGO_URL`
- `VITE_KEYCLOAK_*` (when using Keycloak)
- `VITE_COGNITO_*` (when using Cognito)
- `VITE_EDGE_API_URL` — second backend (no cookies, headers only)

See [`src/config/environment.ts`](src/config/environment.ts) for the full list.

## How to extend

### Add a route

1. Add the page component under `src/features/<name>/`.
2. Register it in [`src/routes/routeConfig.ts`](src/routes/routeConfig.ts).
3. Add a sidebar entry in [`src/constants/navigation.ts`](src/constants/navigation.ts).

### Add an API endpoint

1. Add the endpoint to [`src/constants/apiConfig.ts`](src/constants/apiConfig.ts).
2. Call it via `invokeService(API_CONFIG.section.name, { params }, payload)`.

### Switch auth strategy

Set `VITE_AUTH_TYPE` in `.env`. The factory in [`src/auth/authStrategyFactory.ts`](src/auth/authStrategyFactory.ts) picks the right strategy at runtime.

### Customise theming

Edit CSS custom properties in [`src/styles/themes/theme-default.css`](src/styles/themes/theme-default.css). Tailwind classes (`bg-primary`, `text-on`, etc.) are backed by these variables.

## Migration checklist (for a brand new project)

1. Clone or copy this directory, then `rm -rf .git && git init`.
2. Update `package.json` `name`.
3. Edit `.env.development` and `.env.production` — set `VITE_APP_TITLE`, `VITE_API_URL`, `VITE_TENANT_UID`.
4. Replace `public/favicon.ico` and `public/assets/logo.png`.
5. Update `index.html` `<title>`.
6. Edit `src/constants/navigation.ts` to match your sidebar.
7. Edit `src/routes/routeConfig.ts` — remove sample routes, add yours.
8. Delete `src/features/sample/` once you've used it as a reference.
9. Run `npm install && npm run dev`.

## Project structure

```
src/
  app/layout/         # AuthenticatedLayout, PublicLayout, FullscreenLayout, Sidebar, TopBar, UserMenu
  auth/               # Strategy interface + factory + 3 implementations
  components/
    primitives/       # Low-level UI primitives
    ui/               # Shared composite components
    tps-data-table/   # AG Grid wrapper
    tps-form/         # DynamicForm engine
  config/             # environment.ts
  constants/          # apiConfig, navigation, storageKeys, themes
  features/           # auth, profile, settings, landing, sample
  hooks/              # useAuth, useTheme, useToast, useAppSelector, useAppDispatch, useMediaQuery
  lib/                # axios, invokeService helpers, secureStorage, toast, snackbar, logger, utils
  pages/              # NotFoundPage
  providers/          # AppProviders, ThemeProvider, QueryProvider
  routes/             # routeConfig, ProtectedRoute, GuestRoute, DynamicRoutes
  services/           # invokeService, authApi
  store/              # Redux store + slices (auth, theme)
  styles/             # globals.css, themes/, ag-grid-override.css
  types/              # auth.ts
  utils/              # cn, dateFormat, validators, sort, sanitize, export, animations
```
