/**
 * Standard India fashion-planning seasons. Aligned with the Indian
 * Meteorological Department's four-season model, adjusted for retail
 * calendar terminology.
 *
 * Reference: https://mausam.imd.gov.in/ — IMD publishes seasonal
 * classification as the industry standard.
 */

export interface SeasonDef {
  id: 'winter' | 'summer' | 'monsoon' | 'festive';
  label: string;
  imdLabel: string;
  months: number[]; // 0-indexed
  weather: string;
  fashionFocus: string;
  boostCategories: string[];
  reduceCategories: string[];
  tone: { bg: string; fg: string; border: string; solid: string };
}

export const INDIA_SEASONS: SeasonDef[] = [
  {
    id: 'winter',
    label: 'Winter',
    imdLabel: 'Winter (IMD)',
    months: [11, 0, 1], // Dec, Jan, Feb
    weather: 'Cold in the North, mild-to-warm elsewhere',
    fashionFocus: 'Winter apparel · wedding season peak · festive tail (New Year, Republic Day)',
    boostCategories: ['Sweaters', 'Jackets', 'Sweatshirts', 'Thermals', 'Ethnic wear', 'Wedding wear', 'Sherwanis', 'Blazers'],
    reduceCategories: ['Cotton T-shirts', 'Shorts', 'Sleeveless'],
    tone: { bg: 'rgba(99,102,241,0.14)', fg: '#4338ca', border: 'rgba(99,102,241,0.32)', solid: '#6366f1' },
  },
  {
    id: 'summer',
    label: 'Summer',
    imdLabel: 'Pre-monsoon / Summer (IMD)',
    months: [2, 3, 4], // Mar, Apr, May
    weather: 'Hot and dry, heatwaves possible in North/Central',
    fashionFocus: 'Lightweight cotton, linen, shorts · summer wedding & pre-monsoon events',
    boostCategories: ['Cotton', 'Linen', 'T-shirts', 'Shorts', 'Kurtas (light)', 'Rayon', 'Breathable weaves', 'Summer dresses'],
    reduceCategories: ['Heavy outerwear', 'Denim (heavy wash)', 'Wool', 'Thermal'],
    tone: { bg: 'rgba(245,158,11,0.16)', fg: '#b45309', border: 'rgba(245,158,11,0.32)', solid: '#f59e0b' },
  },
  {
    id: 'monsoon',
    label: 'Monsoon',
    imdLabel: 'Southwest monsoon (IMD)',
    months: [5, 6, 7, 8], // Jun, Jul, Aug, Sep
    weather: 'Heavy rainfall across most of India (except Rajasthan/Ladakh)',
    fashionFocus: 'Rainwear, quick-dry, synthetic blends · Independence Day + Raksha Bandhan events',
    boostCategories: ['Quick-dry synthetic', 'Polyester blends', 'Rainwear', 'Light cotton', 'Ethnic wear (RB)', 'Kurta sets'],
    reduceCategories: ['Suede', 'Leather', 'Heavy denim', 'Wool'],
    tone: { bg: 'rgba(59,130,246,0.14)', fg: '#1e40af', border: 'rgba(59,130,246,0.30)', solid: '#3b82f6' },
  },
  {
    id: 'festive',
    label: 'Festive',
    imdLabel: 'Post-monsoon / Retreating monsoon (IMD)',
    months: [9, 10], // Oct, Nov
    weather: 'Cooling down, dry, occasional post-monsoon showers',
    fashionFocus: 'Largest retail window of the year — Navratri, Durga Puja, Dussehra, Karva Chauth, Diwali',
    boostCategories: ['Ethnic wear', 'Sarees', 'Kurtas', 'Sherwanis', 'Chaniya cholis', 'Kids ethnic', 'Occasion wear', 'Gifting apparel'],
    reduceCategories: ['Beach/summer wear'],
    tone: { bg: 'rgba(236,72,153,0.14)', fg: '#be185d', border: 'rgba(236,72,153,0.28)', solid: '#ec4899' },
  },
];

export function seasonForMonth(m0: number): SeasonDef {
  return INDIA_SEASONS.find((s) => s.months.includes(m0)) ?? INDIA_SEASONS[0];
}
