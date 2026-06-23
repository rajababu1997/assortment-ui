/** Mirrors the Angular iUser model — keep optional fields broad to accept any backend shape. */
export interface iUser {
  uuid?: string;
  userName?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  role?: string;
  contactNo?: string;
  status?: string;
  tenantUid?: string;
  avatar?: string;
  pic?: string;
}

/** iUser guaranteed to have userName after successful sign-in. */
export interface CurrentUser extends iUser {
  userName: string;
}

export interface SignInCredentials {
  username: string;
  password: string;
}

export interface AuthState {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
}
