/**
 * Demo-only clock slice. Lets the demo operator change what the app
 * thinks "today" is, so countdowns / overdue states / next-up-period
 * can be shown for any target month without waiting for the calendar.
 *
 * Persisted to localStorage so a refresh keeps the chosen date.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const DEFAULT_TODAY = new Date('2025-10-01T09:00:00').getTime();
const STORAGE_KEY = 'demo_clock_today_ms';

interface DemoClockState {
  today_ms: number;
}

function load(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const n = parseInt(raw, 10);
      if (Number.isFinite(n)) return n;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_TODAY;
}

function save(ms: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(ms));
  } catch {
    /* ignore */
  }
}

const initialState: DemoClockState = {
  today_ms: load(),
};

const demoClockSlice = createSlice({
  name: 'demoClock',
  initialState,
  reducers: {
    setDemoToday(state, action: PayloadAction<number>) {
      state.today_ms = action.payload;
      save(action.payload);
    },
    resetDemoToday(state) {
      state.today_ms = DEFAULT_TODAY;
      save(DEFAULT_TODAY);
    },
  },
});

export const DEMO_CLOCK_DEFAULT_ISO = new Date(DEFAULT_TODAY).toISOString();
export const { setDemoToday, resetDemoToday } = demoClockSlice.actions;
export default demoClockSlice.reducer;
