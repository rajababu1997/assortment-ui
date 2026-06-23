import type { IAuthStrategy, AuthType } from '@/auth/AuthStrategy';
import { BasicAuthStrategy } from '@/auth/strategies/BasicAuthStrategy';
import { KeycloakStrategy } from '@/auth/strategies/KeycloakStrategy';
import { CognitoStrategy } from '@/auth/strategies/CognitoStrategy';

let _strategy: IAuthStrategy | null = null;

/**
 * Returns the singleton auth strategy for the current VITE_AUTH_TYPE.
 * Lazy-initialised on first call — safe to import anywhere without
 * triggering keycloak-js or Amplify side-effects at module load time.
 */
export function getAuthStrategy(): IAuthStrategy {
  if (_strategy) return _strategy;

  const authType = (import.meta.env.VITE_AUTH_TYPE ?? 'BASIC') as AuthType;

  switch (authType) {
    case 'KEYCLOAK':
      _strategy = new KeycloakStrategy();
      break;
    case 'AWS_COGNITO':
      _strategy = new CognitoStrategy();
      break;
    case 'BASIC':
    default:
      _strategy = new BasicAuthStrategy();
      break;
  }

  return _strategy;
}

/** Exposed for testing only — replaces the singleton. */
export function _setAuthStrategy(strategy: IAuthStrategy) {
  _strategy = strategy;
}
