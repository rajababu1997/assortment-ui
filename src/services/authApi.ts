/**
 * Auth API — pure Axios calls, no Redux, no hooks.
 *
 * Used by:
 *   - KeycloakStrategy / CognitoStrategy: `fetchUserProfileApi`.
 *   - ForgotPasswordPage / ResetPasswordPage.
 */
import axios from 'axios';
import type { CurrentUser } from '@/types/auth';
import { environment } from '@/config/environment';
import { API_CONFIG } from '@/constants/apiConfig';

const BASE_URL = environment.apiUrl;
const TENANT_UID = environment.tenantUid;

export async function fetchUserProfileApi(accessToken: string, authType: string): Promise<CurrentUser> {
  const { data } = await axios.get<CurrentUser>(`${BASE_URL}${API_CONFIG.auth.me.url}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Client: TENANT_UID,
      auth: authType,
    },
  });
  return data;
}

export async function forgotPasswordApi(email: string): Promise<void> {
  await axios.post(`${BASE_URL}${API_CONFIG.auth.forgot.url}`, { email });
}

export async function resetPasswordApi(password: string, token?: string): Promise<void> {
  await axios.post(`${BASE_URL}${API_CONFIG.auth.reset.url}`, { password, token });
}
