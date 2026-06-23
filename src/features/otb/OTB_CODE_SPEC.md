# OTB Code — backend contract

Every OTB row carries a stable, human-readable business identifier called
**`otb_code`** in addition to its surrogate primary key. This document
captures the rules the frontend already follows so the backend (qa_server_inspect
/ qa_server_common) can mirror them when the real persistence layer ships.

> Sibling specs:
> - [`ANNUAL_PLAN_SPEC.md`](./ANNUAL_PLAN_SPEC.md) — multi-plan model, `plan_id`, state machine, URL map
> - [`CATEGORY_BANDS_SPEC.md`](./CATEGORY_BANDS_SPEC.md) — per-category MRP × cost band master data
> - [`../value/VALUE_PLAN_SPEC.md`](../value/VALUE_PLAN_SPEC.md) — downstream Step 2 (Value Plan)

## Format

```
OTB-{periodKey}-{categoryCode}
```

| Segment        | Description                                                                                | Example       |
| -------------- | ------------------------------------------------------------------------------------------ | ------------- |
| `OTB`          | Constant prefix — identifies the resource type.                                            | `OTB`         |
| `periodKey`    | Stable period identifier (matches `Period.key`). Format depends on the planning cycle.     | `2026-04`     |
| `categoryCode` | Master-data code of the category. Already brand-prefixed in our seed data (e.g. `ZARA-WTOP`). | `ZARA-WTOP`   |

### Examples

| Period       | Brand × Category               | otb_code                 |
| ------------ | ------------------------------ | ------------------------ |
| April 2026   | Zara · Women's Tops            | `OTB-2026-04-ZARA-WTOP`  |
| May 2026     | Puma · Sports Wear             | `OTB-2026-05-PUMA-SPRT`  |
| Q1 2026      | Tommy Hilfiger · Classic       | `OTB-2026-Q1-TH-CLSC`    |
| Week 14 2026 | Puma · Casual Wear             | `OTB-2026-W14-PUMA-CSL`  |

### Period key formats currently in use

| Planning cycle | Format        | Example      |
| -------------- | ------------- | ------------ |
| Monthly        | `YYYY-MM`     | `2026-04`    |
| Weekly         | `YYYY-Www`    | `2026-W14`   |
| Quarterly      | `YYYY-Qq`     | `2026-Q1`    |

### Validation regex (suggested)

```
^OTB-\d{4}-(\d{2}|W\d{2}|Q[1-4])-[A-Z][A-Z0-9]*(-[A-Z0-9]+)+$
```

## Generation rules

1. **Deterministic.** Given `(period_key, category_id)` the code is fully
   computable. No counters, no time component, no randomness — re-running
   the generator on the same input must always produce the same string.
2. **Server is the source of truth.** When the backend ships, the API
   should compute and return `otb_code` on every row it returns. The UI
   currently mints the code client-side (see `src/features/otb/utils/otbCode.ts`)
   purely as a placeholder until the persistence layer exists.
3. **Assigned at row creation.** Set the code on the same write that
   creates the OTB row; never on read.
4. **Immutable.** The code does not change for the life of the row, even
   if the numeric fields are edited or the row moves between DRAFT →
   APPROVED → LOCKED.

## Uniqueness constraint

```
UNIQUE (plan_id, period_key, brand_id, category_id)
UNIQUE (plan_id, otb_code)
```

Both keys are scoped to the **`plan_id`** of the parent Annual Plan
(see [`ANNUAL_PLAN_SPEC.md`](./ANNUAL_PLAN_SPEC.md)). The first prevents
the same brand × category being added twice to the same period (already
enforced in the UI via the picker). The second is the human-facing
guarantee — the code surfaces in release emails, exports, audit logs
and downstream integrations, so it must be globally unique within an
annual plan.

Across plans the same `otb_code` value can recur (FY24 and FY26 each have
their own `OTB-2026-04-ZARA-WTOP` if both windows happen to cover April
2026 — though our default cycle prevents this in practice). Always join
on `(plan_id, otb_code)`, never on `otb_code` alone.

## Lifecycle

| Event                                      | Effect on `otb_code` |
| ------------------------------------------ | -------------------- |
| Row created from picker                    | Computed and stored  |
| Row created from CSV import                | Computed and stored  |
| Row created from auto-fill                 | Computed and stored  |
| Numeric field edited (pre- or post-release) | Unchanged            |
| Period state → APPROVED / LOCKED (released) | Unchanged            |
| Period re-released after edits             | Unchanged            |
| Period skipped                             | Unchanged            |
| Plan reset / discarded                     | Codes deleted with the rows |

## Display

- The frontend table (`OtbRowTable.tsx`) renders the code as the **first
  column** in monospaced font.
- Exports (CSV, PDF release sheets) **must** include the code in the
  first column so a merchandiser can paste it into an order email and
  trace it back to the row.
- Search / filter inputs should match against the code in addition to
  brand and category names.

## API shape (illustrative)

When the backend exposes OTB rows, recommended JSON shape:

```json
{
  "row_id": "uuid-v7",
  "plan_id": "AP-20260401-20270331",
  "otb_code": "OTB-2026-04-ZARA-WTOP",
  "period_key": "2026-04",
  "brand_id": "uuid",
  "category_id": "uuid",
  "planned_sales": 14000000,
  "markdowns": 1680000,
  "eom_inventory": 11000000,
  "bom_inventory": 9500000,
  "on_order": 3200000
}
```

`row_id` is the surrogate primary key (internal joins, etc.).
`plan_id` scopes the row to its parent Annual Plan.
`otb_code` is the human-facing business identifier (UI, exports, emails).

## Frontend touch points

- Type: `src/features/otb/types.ts` → `OtbRow.otb_code`
- Helper: `src/features/otb/utils/otbCode.ts` → `buildOtbCode`,
  `buildOtbCodeFromCategoryCode`
- Set on creation in:
  - `src/features/otb/components/PeriodEditor.tsx` (picker → new row)
  - `src/features/otb/annual/annual.component.tsx` (Historical-lens add)
  - `src/features/otb/utils/autofill.ts` (auto-fill demo)
- Displayed in: `src/features/otb/components/OtbRowTable.tsx` (first column)
