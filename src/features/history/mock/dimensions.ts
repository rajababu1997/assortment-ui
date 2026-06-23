/**
 * Demo-only sub-dimension taxonomy. Mirrors what a real fashion brand
 * would have on every SKU.
 */

export interface DimensionItem {
  key: string;
  label: string;
}

export const MRP_BANDS: DimensionItem[] = [
  { key: 'mrp-499-799', label: '₹499–799' },
  { key: 'mrp-799-999', label: '₹799–999' },
  { key: 'mrp-999-1499', label: '₹999–1499' },
  { key: 'mrp-1499+', label: '₹1499+' },
];

export const COST_BANDS: DimensionItem[] = [
  { key: 'cost-100-150', label: '₹100–150' },
  { key: 'cost-150-250', label: '₹150–250' },
  { key: 'cost-250+', label: '₹250+' },
];

export const FITS: DimensionItem[] = [
  { key: 'slim', label: 'Slim' },
  { key: 'regular', label: 'Regular' },
  { key: 'oversized', label: 'Oversized' },
  { key: 'relaxed', label: 'Relaxed' },
];

export const SIZES: DimensionItem[] = [
  { key: 'xs', label: 'XS' },
  { key: 's', label: 'S' },
  { key: 'm', label: 'M' },
  { key: 'l', label: 'L' },
  { key: 'xl', label: 'XL' },
  { key: 'xxl', label: 'XXL' },
];

export const COLORS: DimensionItem[] = [
  { key: 'navy', label: 'Navy' },
  { key: 'sage', label: 'Sage Green' },
  { key: 'off-white', label: 'Off-white' },
  { key: 'black', label: 'Black' },
  { key: 'pastel-pink', label: 'Pastel Pink' },
  { key: 'mustard', label: 'Mustard' },
  { key: 'burgundy', label: 'Burgundy' },
  { key: 'denim-blue', label: 'Denim Blue' },
  { key: 'olive', label: 'Olive' },
  { key: 'beige', label: 'Beige' },
  { key: 'red', label: 'Red' },
  { key: 'teal', label: 'Teal' },
];

export const PRINTS: DimensionItem[] = [
  { key: 'solid', label: 'Solid' },
  { key: 'striped', label: 'Striped' },
  { key: 'floral', label: 'Floral' },
  { key: 'tie-dye', label: 'Tie-dye' },
  { key: 'check', label: 'Check' },
  { key: 'graphic', label: 'Graphic' },
];

export const FABRICS: DimensionItem[] = [
  { key: 'cotton-100', label: 'Cotton 100%' },
  { key: 'cotton-poly', label: 'Cotton-Poly' },
  { key: 'linen', label: 'Linen' },
  { key: 'polyester', label: 'Polyester' },
  { key: 'viscose', label: 'Viscose' },
];

export const VENDORS: DimensionItem[] = [
  { key: 'vendor-abc', label: 'ABC Manufacturing' },
  { key: 'vendor-xyz', label: 'XYZ Textiles' },
  { key: 'vendor-pqr', label: 'PQR Co.' },
  { key: 'vendor-lmn', label: 'LMN Garments' },
  { key: 'vendor-rst', label: 'RST Mills' },
  { key: 'vendor-jkl', label: 'JKL Apparel' },
  { key: 'vendor-fgh', label: 'FGH Industries' },
  { key: 'vendor-tuv', label: 'TUV Knits' },
];

export const CLUSTERS: DimensionItem[] = [
  { key: 'metro', label: 'Metro' },
  { key: 'tier-2', label: 'Tier-2' },
  { key: 'online', label: 'Online' },
];

export type CompareMode = 'ly-same-month' | 'rolling-12' | 'three-year-avg';

export const COMPARE_MODES: Array<{ key: CompareMode; label: string; help: string }> = [
  { key: 'ly-same-month', label: 'Last year same month', help: 'Anchor against the same month one year ago.' },
  { key: 'rolling-12', label: 'Trailing 12 months', help: 'Average over the last 12 months ending at the comparison month.' },
  { key: 'three-year-avg', label: '3-year average', help: 'Average of the same month across the last 3 years (smooths one-off shocks).' },
];

export const SEASONS = [
  { key: 'spring', label: 'Spring (Feb–Apr)', months: [1, 2, 3] },
  { key: 'summer', label: 'Summer (May–Jul)', months: [4, 5, 6] },
  { key: 'autumn', label: 'Autumn (Aug–Oct)', months: [7, 8, 9] },
  { key: 'winter', label: 'Winter (Nov–Jan)', months: [10, 11, 0] },
] as const;

export type SeasonKey = (typeof SEASONS)[number]['key'];

export const QUARTERS = [
  { key: 'q1', label: 'Q1 (Jan–Mar)', months: [0, 1, 2] },
  { key: 'q2', label: 'Q2 (Apr–Jun)', months: [3, 4, 5] },
  { key: 'q3', label: 'Q3 (Jul–Sep)', months: [6, 7, 8] },
  { key: 'q4', label: 'Q4 (Oct–Dec)', months: [9, 10, 11] },
] as const;

export type QuarterKey = (typeof QUARTERS)[number]['key'];
