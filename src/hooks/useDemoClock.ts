import { useAppSelector } from './useAppSelector';

/** Returns the operator-selected "today" as a millisecond timestamp. */
export function useDemoToday(): number {
  return useAppSelector((s) => s.demoClock.today_ms);
}
