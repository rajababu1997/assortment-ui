/**
 * Compact 14-day strip — one column per day with weather icon, weekday
 * label, tempMax, tempMin. Rendered inline in each CityCard.
 */

import { Cloud, CloudDrizzle, CloudLightning, CloudRain, CloudSnow, Sun } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { DayForecast } from '../types';
import { weekday } from '../utils';

interface Props {
  days: DayForecast[];
}

/** Map WMO weather code → icon + tint. */
function iconFor(code: number): { Icon: LucideIcon; color: string } {
  if (code === 0) return { Icon: Sun, color: '#f59e0b' };
  if (code <= 3) return { Icon: Cloud, color: '#64748b' };
  if (code >= 45 && code <= 48) return { Icon: Cloud, color: '#94a3b8' };
  if (code >= 51 && code <= 57) return { Icon: CloudDrizzle, color: '#0ea5e9' };
  if (code >= 61 && code <= 67) return { Icon: CloudRain, color: '#2563eb' };
  if (code >= 71 && code <= 77) return { Icon: CloudSnow, color: '#60a5fa' };
  if (code >= 80 && code <= 82) return { Icon: CloudRain, color: '#2563eb' };
  if (code >= 95) return { Icon: CloudLightning, color: '#7c3aed' };
  return { Icon: Cloud, color: '#64748b' };
}

export function ForecastStrip({ days }: Props) {
  return (
    <div className="flex gap-1 overflow-x-auto">
      {days.map((d, i) => {
        const { Icon, color } = iconFor(d.weatherCode);
        return (
          <div
            key={d.date}
            className="flex min-w-[42px] flex-1 flex-col items-center rounded-md border px-1 py-1"
            style={{
              borderColor: i === 0 ? 'rgba(96,165,250,0.35)' : 'var(--color-divider)',
              background: i === 0 ? 'color-mix(in srgb, var(--color-primary) 6%, transparent)' : 'var(--color-surface)',
            }}
            title={`${d.date} · ${d.tempMax.toFixed(0)}°/${d.tempMin.toFixed(0)}° · rain ${d.precipProbability}%`}
          >
            <span
              className="text-[9px] font-semibold uppercase tracking-wider"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              {weekday(d.date)}
            </span>
            <Icon size={14} style={{ color }} className="my-1" />
            <span
              className="text-[10.5px] font-bold tabular-nums leading-none"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {d.tempMax.toFixed(0)}°
            </span>
            <span
              className="mt-0.5 text-[9px] tabular-nums leading-none"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              {d.tempMin.toFixed(0)}°
            </span>
            {d.precipProbability > 30 && (
              <span
                className="mt-0.5 text-[9px] font-medium tabular-nums leading-none"
                style={{ color: '#2563eb' }}
              >
                {d.precipProbability}%
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
