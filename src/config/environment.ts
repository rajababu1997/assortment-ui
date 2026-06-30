/**
 * Environment config — single source of truth for all env-driven settings.
 *
 * Values come from `.env.development` / `.env.production` (Vite injects them
 * at build time via `import.meta.env`).
 *
 * To add a new env var:
 *   1. Add `VITE_FOO` to `.env.development` and `.env.production`
 *   2. Add `'VITE_FOO'` to REQUIRED_ENV_VARS if it must be set, OR
 *      reference `import.meta.env.VITE_FOO ?? ''` below for optional.
 */

const REQUIRED_ENV_VARS = [
  'VITE_APP_TITLE',
  'VITE_API_URL',
  'VITE_TENANT_UID',
] as const;

const missing = REQUIRED_ENV_VARS.filter((key) => !import.meta.env[key]);

if (missing.length > 0) {
  throw new Error(
    `Missing required environment variables:\n${missing
      .map((k) => `  - ${k}`)
      .join('\n')}\n\nCheck your .env.development or .env.production file.`
  );
}

export const environment = {
  production: import.meta.env.PROD,

  // ── Branding ──────────────────────────────────────────────────────────────
  appTitle: import.meta.env.VITE_APP_TITLE,
  appSubtitle: import.meta.env.VITE_APP_SUBTITLE ?? '',
  companyName: import.meta.env.VITE_COMPANY_NAME ?? 'RKs Fashion Ltd',
  poweredBy: import.meta.env.VITE_POWERED_BY ?? '',
  copyrights: import.meta.env.VITE_COPYRIGHTS ?? '',
  helpEmail: import.meta.env.VITE_HELP_EMAIL ?? '',
  helpPhone: import.meta.env.VITE_HELP_PHONE ?? '',

  // ── API ───────────────────────────────────────────────────────────────────
  apiUrl: import.meta.env.VITE_API_URL,
  edgeApiUrl: import.meta.env.VITE_EDGE_API_URL ?? '',
  tenantUid: import.meta.env.VITE_TENANT_UID,

  // ── Auth ──────────────────────────────────────────────────────────────────
  authType: (import.meta.env.VITE_AUTH_TYPE ?? 'BASIC') as 'BASIC' | 'KEYCLOAK' | 'AWS_COGNITO',

  // Keycloak (only when VITE_AUTH_TYPE=KEYCLOAK)
  keycloakUrl: import.meta.env.VITE_KEYCLOAK_URL ?? '',
  keycloakRealm: import.meta.env.VITE_KEYCLOAK_REALM ?? '',
  keycloakClientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? '',
  keycloakClientSecret: import.meta.env.VITE_KEYCLOAK_CLIENT_SECRET ?? '',

  // AWS Cognito (only when VITE_AUTH_TYPE=AWS_COGNITO)
  cognitoUserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID ?? '',
  cognitoUserPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID ?? '',

  // ── Branding assets ───────────────────────────────────────────────────────
  logo: import.meta.env.VITE_LOGO_URL ?? '/assets/logo.png',
  logoSmall: import.meta.env.VITE_LOGO_SMALL_URL ?? '/assets/logo-small.png',

  // ── Version ───────────────────────────────────────────────────────────────
  appVersion: import.meta.env.VITE_APP_VERSION ?? '1.0.0',
};
