/**
 * Weather → fashion-category signal mapping. Pure functions; the impact
 * rules are deterministic thresholds on the aggregate window so anything
 * shown on the card can be traced back to the underlying numbers.
 */

import type {
  CategoryImpact,
  DayForecast,
  OpenMeteoDaily,
  PrecipZone,
  TempZone,
  WeatherAggregate,
} from './types';

/** Zip the parallel API arrays into per-day rows. */
export function zipDaily(d: OpenMeteoDaily): DayForecast[] {
  const n = d.time.length;
  const out: DayForecast[] = [];
  for (let i = 0; i < n; i += 1) {
    out.push({
      date: d.time[i],
      tempMax: d.temperature_2m_max[i],
      tempMin: d.temperature_2m_min[i],
      precipSum: d.precipitation_sum[i],
      precipProbability: d.precipitation_probability_max[i] ?? 0,
      weatherCode: d.weather_code[i] ?? 0,
    });
  }
  return out;
}

const avg = (xs: number[]): number =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;

/** Roll up the 14-day window into a single signal shape. */
export function aggregate(days: DayForecast[]): WeatherAggregate {
  const avgTempMax = avg(days.map((d) => d.tempMax));
  const avgTempMin = avg(days.map((d) => d.tempMin));
  const totalPrecip = days.reduce((s, d) => s + d.precipSum, 0);
  const avgPrecipProbability = avg(days.map((d) => d.precipProbability));
  const rainyDays = days.filter((d) => d.precipSum >= 2 || d.precipProbability >= 50).length;
  const hotDays = days.filter((d) => d.tempMax >= 35).length;
  const coldDays = days.filter((d) => d.tempMax <= 15).length;

  return {
    avgTempMax,
    avgTempMin,
    totalPrecip,
    avgPrecipProbability,
    rainyDays,
    hotDays,
    coldDays,
    tempZone: classifyTemp(avgTempMax),
    precipZone: classifyPrecip(avgPrecipProbability, totalPrecip),
  };
}

function classifyTemp(avgTempMax: number): TempZone {
  if (avgTempMax >= 40) return 'heatwave';
  if (avgTempMax >= 32) return 'hot';
  if (avgTempMax >= 25) return 'warm';
  if (avgTempMax >= 18) return 'mild';
  if (avgTempMax >= 10) return 'cool';
  return 'cold';
}

function classifyPrecip(avgProb: number, total: number): PrecipZone {
  if (avgProb >= 60 && total >= 50) return 'heavy-rain';
  if (avgProb >= 40 || total >= 20) return 'rainy';
  return 'dry';
}

// ── Category impact rules ──────────────────────────────────────────────────
//
// Deterministic. Every impact tag traces back to the aggregate. No ML, no
// magic — buyers should be able to read a rule and understand why a
// category is highlighted.

export function deriveImpact(a: WeatherAggregate): CategoryImpact[] {
  const out: CategoryImpact[] = [];

  const heatReason = `Avg high ${Math.round(a.avgTempMax)}°C · ${a.hotDays} day${a.hotDays === 1 ? '' : 's'} above 35°C`;
  const coldReason = `Avg high ${Math.round(a.avgTempMax)}°C · ${a.coldDays} day${a.coldDays === 1 ? '' : 's'} at or below 15°C`;
  const rainReason = `${a.rainyDays} rainy days · avg probability ${Math.round(a.avgPrecipProbability)}%`;
  const dryReason = `Avg probability ${Math.round(a.avgPrecipProbability)}% · ${Math.round(a.totalPrecip)} mm expected`;

  // Temperature-driven categories
  switch (a.tempZone) {
    case 'heatwave':
    case 'hot':
      out.push({ direction: 'boost',  category: 'Cotton',            reason: heatReason });
      out.push({ direction: 'boost',  category: 'T-shirts',          reason: heatReason });
      out.push({ direction: 'boost',  category: 'Shorts',            reason: heatReason });
      out.push({ direction: 'boost',  category: 'Linen',             reason: heatReason });
      out.push({ direction: 'reduce', category: 'Heavy outerwear',   reason: heatReason });
      out.push({ direction: 'reduce', category: 'Denim (heavy wash)',reason: heatReason });
      break;
    case 'warm':
      out.push({ direction: 'boost',  category: 'Casual cotton',     reason: heatReason });
      out.push({ direction: 'boost',  category: 'Light denim',       reason: heatReason });
      break;
    case 'mild':
      out.push({ direction: 'boost',  category: 'Denim',             reason: heatReason });
      out.push({ direction: 'boost',  category: 'Layering (shirts)', reason: heatReason });
      break;
    case 'cool':
      out.push({ direction: 'boost',  category: 'Sweatshirts',       reason: coldReason });
      out.push({ direction: 'boost',  category: 'Light knitwear',    reason: coldReason });
      out.push({ direction: 'boost',  category: 'Denim',             reason: coldReason });
      break;
    case 'cold':
      out.push({ direction: 'boost',  category: 'Jackets',           reason: coldReason });
      out.push({ direction: 'boost',  category: 'Sweaters',          reason: coldReason });
      out.push({ direction: 'boost',  category: 'Thermals',          reason: coldReason });
      out.push({ direction: 'reduce', category: 'Cotton T-shirts',   reason: coldReason });
      out.push({ direction: 'reduce', category: 'Shorts',            reason: coldReason });
      break;
  }

  // Precipitation-driven categories
  switch (a.precipZone) {
    case 'heavy-rain':
      out.push({ direction: 'boost',  category: 'Rainwear',          reason: rainReason });
      out.push({ direction: 'boost',  category: 'Quick-dry synthetic', reason: rainReason });
      out.push({ direction: 'reduce', category: 'Suede / leather',   reason: rainReason });
      break;
    case 'rainy':
      out.push({ direction: 'boost',  category: 'Quick-dry synthetic', reason: rainReason });
      out.push({ direction: 'reduce', category: 'Suede / leather',   reason: rainReason });
      break;
    case 'dry':
      // No precip-driven boost — dryness itself doesn't push a category.
      // But if hot + dry, cottons are already boosted above.
      if (a.tempZone === 'heatwave' || a.tempZone === 'hot') {
        out.push({ direction: 'boost', category: 'Breathable weaves', reason: dryReason });
      }
      break;
  }

  // Dedupe by (direction, category) — the two rule sets can double-boost.
  const seen = new Set<string>();
  return out.filter((i) => {
    const k = `${i.direction}|${i.category}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// ── UI helpers ─────────────────────────────────────────────────────────────

const TEMP_ZONE_LABEL: Record<TempZone, string> = {
  heatwave: 'Heatwave',
  hot: 'Hot',
  warm: 'Warm',
  mild: 'Mild',
  cool: 'Cool',
  cold: 'Cold',
};

const PRECIP_ZONE_LABEL: Record<PrecipZone, string> = {
  'heavy-rain': 'Heavy rain',
  rainy: 'Rainy',
  dry: 'Dry',
};

export const TEMP_ZONE_TONE: Record<TempZone, { bg: string; fg: string; border: string }> = {
  heatwave: { bg: 'rgba(239,68,68,0.16)',   fg: '#b91c1c', border: 'rgba(239,68,68,0.32)' },
  hot:      { bg: 'rgba(245,158,11,0.18)',  fg: '#b45309', border: 'rgba(245,158,11,0.32)' },
  warm:     { bg: 'rgba(234,179,8,0.16)',   fg: '#a16207', border: 'rgba(234,179,8,0.32)' },
  mild:     { bg: 'rgba(16,185,129,0.14)',  fg: '#047857', border: 'rgba(16,185,129,0.30)' },
  cool:     { bg: 'rgba(59,130,246,0.14)',  fg: '#1e40af', border: 'rgba(59,130,246,0.30)' },
  cold:     { bg: 'rgba(99,102,241,0.16)',  fg: '#4338ca', border: 'rgba(99,102,241,0.32)' },
};

export const PRECIP_ZONE_TONE: Record<PrecipZone, { bg: string; fg: string; border: string }> = {
  'heavy-rain': { bg: 'rgba(59,130,246,0.20)',  fg: '#1e40af', border: 'rgba(59,130,246,0.40)' },
  rainy:        { bg: 'rgba(59,130,246,0.14)',  fg: '#1e40af', border: 'rgba(59,130,246,0.30)' },
  dry:          { bg: 'rgba(148,163,184,0.20)', fg: '#475569', border: 'rgba(148,163,184,0.30)' },
};

export const tempZoneLabel = (z: TempZone): string => TEMP_ZONE_LABEL[z];
export const precipZoneLabel = (z: PrecipZone): string => PRECIP_ZONE_LABEL[z];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Jul 4" style short label. */
export function shortDate(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${MONTHS[parseInt(m, 10) - 1]} ${parseInt(d, 10)}`;
}

/** "Sat" style weekday for the strip. */
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export function weekday(iso: string): string {
  const [y, m, d] = iso.split('-').map((v) => parseInt(v, 10));
  return WD[new Date(y, m - 1, d).getDay()];
}
