import { configureStore } from '@reduxjs/toolkit';
import themeReducer from './slices/themeSlice';
import authReducer from './slices/authSlice';
import otbReducer from './slices/otbSlice';
import valuePlanReducer from './slices/valuePlanSlice';
import demoClockReducer from './slices/demoClockSlice';

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    auth: authReducer,
    otb: otbReducer,
    valuePlan: valuePlanReducer,
    demoClock: demoClockReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
