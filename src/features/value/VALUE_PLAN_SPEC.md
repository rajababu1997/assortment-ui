# Value Plan — backend contract

Step 2 of the Assortment Planning pipeline. Captures the buyer's
price-tier cascade against a released OTB row, including implied units,
revenue, and margin. This document captures the rules the frontend already
follows so the backend can mirror them when the persistence layer ships.

> Sibling specs:
> - [`../otb/ANNUAL_PLAN_SPEC.md`](../otb/ANNUAL_PLAN_SPEC.md) — multi-plan model, `plan_id`, state machine, URL map
> - [`../otb/OTB_CODE_SPEC.md`](../otb/OTB_CODE_SPEC.md) — upstream OTB code format
> - [`../otb/CATEGORY_BANDS_SPEC.md`](../otb/CATEGORY_BANDS_SPEC.md) — MRP × cost band master data this plan splits across

## Relationship to Step 1 (OTB)

- One Value Plan per released OTB row, keyed by `(plan_id, otb_code)`.
- A Value Plan can only exist when its parent OTB row is in state `LOCKED`
  (released). Creating one against an unreleased row is invalid.
- If the parent OTB is re-released with a different budget, the Value
  Plan's `budget_snapshot` no longer matches the live OTB ceiling — flag
  the plan as **stale** in the UI and require the buyer to re-confirm.
- See [`OTB_CODE_SPEC.md`](../otb/OTB_CODE_SPEC.md) for the upstream code
  format the FK uses.

## Handover gate (planner ↔ buyer)

Once any Value Plan exists for a given period (regardless of state), the
period switches into **buyer-owned** mode on the release page:

| Planner action on the parent period | After handover |
| ----------------------------------- | -------------- |
| Edit OTB row values                 | Disabled (inputs become read-only) |
| Re-release the period               | Button hidden |
| Skip the period                     | Button hidden |

This prevents the planner from pulling values out from under a buyer
mid-cascade. To unblock the planner, the buyer must explicitly delete
their Value Plan first. See `ANNUAL_PLAN_SPEC.md → State machine` for
the parallel rule on the OTB side.

## Data model

```ts
ValuePlan {
  plan_id: string                   // FK → AnnualPlan.plan_id (NEW — multi-plan scope)
  otb_code: string                  // FK → OtbRow.otb_code
  period_key: string
  brand_uuid: string
  category_uuid: string
  budget_snapshot: number           // OTB budget at last edit, in ₹
  state: 'draft' | 'submitted' | 'approved'
  bands: BandAllocation[]           // exactly 4, ordered cheapest → most expensive
  created_at: timestamp
  submitted_at?: timestamp
  approved_at?: timestamp
}

BandAllocation {
  band_id: 'entry' | 'core' | 'upper' | 'statement'
  budget_pct: number                // 0 – 100
  avg_mrp: number                   // ₹, clamped to category's mrp_min / mrp_max for this band
  avg_cost: number                  // ₹, clamped to category's cost_min / cost_max for this band
}
```

> Note: the frontend slice currently keys plans by `otb_code` only, but
> the backend should always join through `(plan_id, otb_code)` to keep
> scopes clean once multi-FY data lands.

### Derived fields (computed on read, never stored)

| Field            | Formula                                                                |
| ---------------- | ---------------------------------------------------------------------- |
| `band.amount`    | `budget_snapshot × budget_pct / 100`                                   |
| `band.units`     | `floor(band.amount / avg_cost)`                                        |
| `band.revenue`   | `band.units × avg_mrp`                                                 |
| `band.margin`    | `(avg_mrp - avg_cost) / avg_mrp`                                       |
| `plan.allocated` | `Σ band.amount` (should equal `budget_snapshot` when pct sums to 100)  |
| `plan.units`     | `Σ band.units`                                                         |
| `plan.revenue`   | `Σ band.revenue`                                                       |
| `plan.margin`    | `(plan.revenue - plan.allocated) / plan.revenue`                       |

## Validation

### Hard (block submit)

1. `bands.length === 4` and exactly one row per `band_id`.
2. `Σ band.budget_pct === 100`.
3. For every band: `mrp_min ≤ avg_mrp ≤ mrp_max` (using the parent
   category's band definition; `mrp_max = null` means no upper bound).
4. For every band: `cost_min ≤ avg_cost ≤ cost_max`.

### Soft (warning chip, no block)

| Condition                          | Tone   | Message                              |
| ---------------------------------- | ------ | ------------------------------------ |
| `plan.margin < 60 %`               | red    | Below margin target                  |
| `entry.budget_pct < 15 %`          | amber  | Thin entry-tier — may lose footfall  |
| `statement.budget_pct > 25 %`      | amber  | Heavy premium skew — verify w/ head  |

## State machine

```
   ┌─────────┐  setBandPct/Mrp/Cost   ┌─────────┐
   │  DRAFT  │ ─────────────────────► │  DRAFT  │   (any number of edits)
   └────┬────┘                        └────┬────┘
        │ submitValuePlan                  │
        ▼                                  ▼
   ┌──────────┐                       ┌──────────┐
   │ APPROVED │ ◄──── edits + submit ─│ APPROVED │   (re-submit is allowed)
   └──────────┘                       └──────────┘
```

`SUBMITTED` is reserved for future use (separate approver). The current
flow flips straight to `APPROVED` on submit, like Step 1.

## Staleness rule

When the parent OTB is re-released:

1. Backend recomputes the OTB ceiling for the row.
2. If new ceiling ≠ `value_plan.budget_snapshot`, mark the VP **stale**
   (a transient flag, not a column).
3. UI surfaces a yellow banner: *"OTB budget changed from ₹X to ₹Y —
   please reconfirm."*
4. Any submit re-snapshots `budget_snapshot = new_ceiling` and clears
   stale.

## Uniqueness

```
PK: (plan_id, otb_code)
```

A given OTB row carries at most one Value Plan at a time. History of
prior versions belongs in an audit log, not on the main row.

## API shape (illustrative)

```json
{
  "plan_id": "AP-20260401-20270331",
  "otb_code": "OTB-2026-04-ZARA-WTOP",
  "period_key": "2026-04",
  "brand_id": "uuid",
  "category_id": "uuid",
  "budget_snapshot": 14000000,
  "state": "approved",
  "bands": [
    { "band_id": "entry",     "budget_pct": 30, "avg_mrp": 649,  "avg_cost": 140 },
    { "band_id": "core",      "budget_pct": 40, "avg_mrp": 999,  "avg_cost": 230 },
    { "band_id": "upper",     "budget_pct": 20, "avg_mrp": 1499, "avg_cost": 350 },
    { "band_id": "statement", "budget_pct": 10, "avg_mrp": 1999, "avg_cost": 530 }
  ],
  "created_at": "2026-04-02T10:14:00Z",
  "submitted_at": "2026-04-03T17:42:00Z",
  "approved_at": "2026-04-03T17:42:00Z"
}
```

Server returns the derived fields under a `derived` object on read
(`amount`, `units`, `revenue`, `margin`, plus plan-level rollups) so the
client doesn't reimplement formulas if business logic shifts.

## Frontend touch points

- Types: `src/features/value/types.ts` → `ValuePlan`, `BandAllocation`,
  `ReleasedOtbRow`
- Constants: `src/features/value/constants.ts` → `VP_STATES`, `TOTAL_PCT`,
  `SOFT_LIMITS`, `DEFAULT_SPLIT`
- Math: `src/features/value/utils/calc.ts` (one place for every derived
  formula above)
- Slice: `src/store/slices/valuePlanSlice.ts`
- Hooks: `src/features/value/useValue.ts` → `useValuePlan`,
  `useAllValuePlans`, `useReleasedOtbRows`, `useCurrentOtbBudget`
- Band master data: `src/features/otb/mockData/brands.ts` →
  `SEED_CATEGORIES[*].bands` (the source of truth for MRP/cost ranges)
