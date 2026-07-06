/**
 * Static list of major Indian metro cities used as the weather board's
 * anchor points. Coordinates come from the standard city centres — 3
 * decimal places is more than enough for a metro-scale weather forecast.
 */

import type { City } from '../types';

export const INDIA_CITIES: City[] = [
  { id: 'delhi',       name: 'Delhi',       region: 'North',   state: 'Delhi',              latitude: 28.614, longitude: 77.209 },
  { id: 'mumbai',      name: 'Mumbai',      region: 'West',    state: 'Maharashtra',        latitude: 19.076, longitude: 72.878 },
  { id: 'bengaluru',   name: 'Bengaluru',   region: 'South',   state: 'Karnataka',          latitude: 12.972, longitude: 77.594 },
  { id: 'chennai',     name: 'Chennai',     region: 'South',   state: 'Tamil Nadu',         latitude: 13.083, longitude: 80.270 },
  { id: 'kolkata',     name: 'Kolkata',     region: 'East',    state: 'West Bengal',        latitude: 22.573, longitude: 88.364 },
  { id: 'hyderabad',   name: 'Hyderabad',   region: 'South',   state: 'Telangana',          latitude: 17.385, longitude: 78.487 },
  { id: 'pune',        name: 'Pune',        region: 'West',    state: 'Maharashtra',        latitude: 18.521, longitude: 73.856 },
  { id: 'ahmedabad',   name: 'Ahmedabad',   region: 'West',    state: 'Gujarat',            latitude: 23.023, longitude: 72.572 },
  { id: 'jaipur',      name: 'Jaipur',      region: 'North',   state: 'Rajasthan',          latitude: 26.912, longitude: 75.788 },
  { id: 'chandigarh',  name: 'Chandigarh',  region: 'North',   state: 'Chandigarh',         latitude: 30.734, longitude: 76.779 },
  { id: 'lucknow',     name: 'Lucknow',     region: 'Central', state: 'Uttar Pradesh',      latitude: 26.847, longitude: 80.947 },
  { id: 'guwahati',    name: 'Guwahati',    region: 'East',    state: 'Assam',              latitude: 26.144, longitude: 91.736 },
];
