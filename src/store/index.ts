import { configureStore } from '@reduxjs/toolkit';
import themeReducer from './slices/themeSlice';
import authReducer from './slices/authSlice';
import otbReducer from './slices/otbSlice';
import valuePlanReducer from './slices/valuePlanSlice';
import optionPlanReducer from './slices/optionPlanSlice';
import demoClockReducer from './slices/demoClockSlice';

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    auth: authReducer,
    otb: otbReducer,
    valuePlan: valuePlanReducer,
    optionPlan: optionPlanReducer,
    demoClock: demoClockReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
