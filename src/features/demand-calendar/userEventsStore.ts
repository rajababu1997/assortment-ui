/**
 * LocalStorage-backed store for user-created demand calendar events.
 *
 * Persists across logout/login (localStorage, not sessionStorage). Uses the
 * shared envelope helper so we get a schema-version tag for free.
 */

import { useCallback, useEffect, useState } from 'react';
import { getItem, setItem, subscribe } from '@/lib/localStorageDb';
import type { Signal } from './types';

const STORAGE_KEY = 'demand-calendar/user-events';

function readAll(): Signal[] {
  const raw = getItem<Signal[]>(STORAGE_KEY);
  if (!Array.isArray(raw)) return [];
  return raw.map((s) => ({ ...s, isUserCreated: true }));
}

function writeAll(events: Signal[]): void {
  setItem(STORAGE_KEY, events);
}

export function useUserEvents() {
  const [events, setEvents] = useState<Signal[]>(() => readAll());

  // Sync on cross-tab writes.
  useEffect(() => {
    const unsub = subscribe((key) => {
      if (key === STORAGE_KEY) setEvents(readAll());
    });
    return unsub;
  }, []);

  const add = useCallback((event: Signal) => {
    const next = [
      ...readAll(),
      { ...event, isUserCreated: true, createdAt: Date.now() },
    ];
    writeAll(next);
    setEvents(next);
  }, []);

  const remove = useCallback((id: string) => {
    const next = readAll().filter((e) => e.id !== id);
    writeAll(next);
    setEvents(next);
  }, []);

  return { events, add, remove };
}
