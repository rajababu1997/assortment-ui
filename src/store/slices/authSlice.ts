import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, CurrentUser, SignInCredentials } from '@/types/auth';
import { getAuthStrategy } from '@/auth/authStrategyFactory';

export const signIn = createAsyncThunk<{ user: CurrentUser }, SignInCredentials>(
  'auth/signIn',
  async (credentials, { rejectWithValue }) => {
    try {
      const { user } = await getAuthStrategy().login(credentials);
      return { user };
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      const message = (err as { userMessage?: string }).userMessage;
      return rejectWithValue(
        message ?? (status === 401 ? 'Invalid username or password.' : 'Something went wrong. Please try again.')
      );
    }
  }
);

export const signOut = createAsyncThunk<void, void>('auth/signOut', async () => {
  await getAuthStrategy().logout();
});

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitializing: true,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<CurrentUser>) {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.isInitializing = false;
      state.error = null;
    },
    clearUser(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.isInitializing = false;
      state.error = null;
    },
    setInitializing(state, action: PayloadAction<boolean>) {
      state.isInitializing = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signIn.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.isLoading = false;
        state.isInitializing = false;
        state.error = null;
      })
      .addCase(signIn.rejected, (state, action) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.isInitializing = false;
        state.error = action.payload as string;
      })
      .addCase(signOut.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.isInitializing = false;
        state.error = null;
      });
  },
});

export const { setUser, clearUser, setInitializing, setLoading, setError } = authSlice.actions;
export default authSlice.reducer;
