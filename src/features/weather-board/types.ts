/**
 * Shapes for the Open-Meteo daily forecast + our derived fashion signals.
 *
 * The API returns parallel arrays keyed by day; we zip them into a
 * `DayForecast[]` before consumption to keep component code readable.
 */

export interface City {
  id: string;
  name: string;
  region: 'North' | 'South' | 'East' | 'West' | 'Central';
  state: string;
  latitude: number;
  longitude: number;
}

/** Raw Open-Meteo daily block — parallel arrays. */
export interface OpenMeteoDaily {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_sum: number[];
  precipitation_probability_max: number[];
  weather_code: number[];
}

export interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  daily: OpenMeteoDaily;
}

export interface DayForecast {
  date: string;
  tempMax: number;
  tempMin: number;
  precipSum: number;
  precipProbability: number;
  weatherCode: number;
}

/** Aggregate signal for the whole forecast window, driving category impact. */
export type TempZone = 'heatwave' | 'hot' | 'warm' | 'mild' | 'cool' | 'cold';
export type PrecipZone = 'heavy-rain' | 'rainy' | 'dry';

export interface WeatherAggregate {
  avgTempMax: number;
  avgTempMin: number;
  totalPrecip: number;
  avgPrecipProbability: number;
  rainyDays: number;
  hotDays: number;
  coldDays: number;
  tempZone: TempZone;
  precipZone: PrecipZone;
}

export type ImpactDirection = 'boost' | 'reduce';

export interface CategoryImpact {
  direction: ImpactDirection;
  category: string;
  reason: string;
}

// ── Historical climate types (Year View) ───────────────────────────────────

export interface HistoricalDaily {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_sum: number[];
}

export interface HistoricalResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  daily: HistoricalDaily;
}

/** Averaged monthly climate for one (city × month). */
export interface CityMonthClimate {
  cityId: string;
  cityName: string;
  region: City['region'];
  month: number; // 0..11
  avgTempMax: number;
  avgTempMin: number;
  totalPrecip: number;   // avg mm across the years
  rainyDays: number;     // avg count of days with >=2mm precip
  yearsAveraged: number;
}
