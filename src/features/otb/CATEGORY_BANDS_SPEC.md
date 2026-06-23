# Category MRP × Cost Bands — backend contract

Every `Category` carries a fixed set of **paired** MRP and cost ranges
(the "price ladder"). Value Plan (Step 2) splits a released OTB budget
across these bands; downstream steps (Option Plan, Design, Vendor)
enforce that designs and POs stay inside the band their value-plan row
allocated them to.

## Why paired bands, not independent

Industry standard at every major fashion retailer (Inditex, H&M,
Reliance Trends, Myntra, Westside) — cost scales with price within a
brand. Decoupling them would force the buyer to enter two independent
splits that downstream consumers can't usefully cross-reference.

Each band is therefore one row carrying *both* MRP and cost ranges. See
`VALUE_PLAN_SPEC.md` for the consumer-side rules.

## Data model

```ts
Category {
  id: uuid
  brand_id: uuid
  code: string                        // e.g. 'ZARA-WTOP'
  name: string                        // e.g. "Women's Tops"
  bands: MrpBand[]                    // exactly 4, ordered cheapest → most expensive
}

MrpBand {
  id: 'entry' | 'core' | 'upper' | 'statement'
  label: string                        // display label ("Entry", "Core", ...)
  mrp_min: number                      // ₹, inclusive
  mrp_max: number | null               // ₹, inclusive — `null` = open-ended top
  cost_min: number                     // ₹, inclusive
  cost_max: number                     // ₹, inclusive
}
```

## Invariants

| Rule | Why |
| ---- | --- |
| `bands.length === 4` | UI assumes exactly four; Value-Plan slider grid is built around it |
| Exactly one row per `id` (`entry`, `core`, `upper`, `statement`) | Same |
| Bands ordered cheapest → most expensive (by `mrp_min`) | Allocation bar, default split (`30/40/20/10`) rely on order |
| For each band: `mrp_min ≤ mrp_max` (when `mrp_max ≠ null`) | Range validity |
| For each band: `cost_min ≤ cost_max` | Range validity |
| Across bands: ranges should not overlap on MRP | A given MRP must map to exactly one band (used by `findBandForMrp`) |
| `cost_max ≈ 0.27–0.30 × mrp_max` per band | Keeps implied margin roughly constant within the brand (~70 % for mass, ~73 % for premium) — informational, not enforced |
| `mrp_max` of top band is `null` (open-ended) | Statement tier covers "everything above" |

## Open-ended top band

Only the `statement` band may have `mrp_max = null`. Backend should treat
`null` as "no upper bound" — selecting which band an MRP value falls into:

```
if mrp >= band.mrp_min AND (band.mrp_max IS NULL OR mrp < band.mrp_max) then band
```

## Default templates

When a new Category is created in master-data, prefill its `bands` from
one of four templates and let the merch team tune:

| Template | Use for | Margin target |
| -------- | ------- | ------------- |
| `mass`     | Zara basics, Westside daily wear | ~70 % |
| `mid`      | Most mainstream brands | ~70 % |
| `premium`  | Tommy Hilfiger, Calvin Klein | ~73 % |
| `luxury`   | Iconic / runway lines | ~75 % |

Specific seed values live in `src/features/otb/mockData/brands.ts`
(`SEED_CATEGORIES[*].bands`) — use those as starting points when porting
to a backend seed migration.

## Example — Zara Women's Tops (mass template)

| Band      | MRP range (₹)  | Cost range (₹) | Implied margin |
| --------- | -------------- | -------------- | -------------- |
| Entry     | 499 – 799      | 100 – 180      | ~70 %          |
| Core      | 799 – 1 199    | 180 – 280      | ~70 %          |
| Upper     | 1 199 – 1 799  | 280 – 420      | ~70 %          |
| Statement | 1 799+         | 420 – 650      | ~70 %          |

## Lifecycle

| Event | Effect |
| ----- | ------ |
| Category created | Bands populated from template |
| Bands edited by merch | New Value Plans use new ranges; existing Value Plans keep their `avg_mrp` / `avg_cost` numbers (already clamped at write) |
| Category deleted | Bands deleted with it (cascade) |

**Bands are not versioned.** If the merch team needs to re-tier a
category mid-season, that's a deliberate master-data change and existing
Value Plans should be reviewed.

## API shape (illustrative)

```json
{
  "id": "uuid",
  "brand_id": "uuid",
  "code": "ZARA-WTOP",
  "name": "Women's Tops",
  "bands": [
    { "id": "entry",     "label": "Entry",     "mrp_min": 499,  "mrp_max": 799,  "cost_min": 100, "cost_max": 180 },
    { "id": "core",      "label": "Core",      "mrp_min": 799,  "mrp_max": 1199, "cost_min": 180, "cost_max": 280 },
    { "id": "upper",     "label": "Upper",     "mrp_min": 1199, "mrp_max": 1799, "cost_min": 280, "cost_max": 420 },
    { "id": "statement", "label": "Statement", "mrp_min": 1799, "mrp_max": null, "cost_min": 420, "cost_max": 650 }
  ]
}
```

## Frontend touch points

- Types: `src/features/otb/types.ts` → `Category`, `MrpBand`
- Seed data: `src/features/otb/mockData/brands.ts` → `SEED_CATEGORIES[*].bands`
- Lookup helper: `src/features/otb/mockData/brands.ts` → `findBandForMrp(category, mrp)`
- Consumed by: Value Plan editor — see `../value/VALUE_PLAN_SPEC.md`
