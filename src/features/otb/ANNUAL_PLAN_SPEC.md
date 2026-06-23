# Annual Plan — backend contract

Every OTB cycle is owned by an **Annual Plan**. The frontend supports any
number of plans co-existing (FY 2024, FY 2025, FY 2026 in flight at the
same time), keyed by a deterministic `plan_id`. This document captures
the rules the frontend already follows so the backend (qa_server_inspect /
qa_server_common) can mirror them.

## Concepts

| Concept       | Description                                                                                              |
| ------------- | -------------------------------------------------------------------------------------------------------- |
| **AnnualPlan**| One OTB cycle. Owns a date window, a budget, a set of `PeriodPlan`s, and a state machine.                |
| **PeriodPlan**| One slot inside an AnnualPlan (a month, week or quarter depending on cycle). Owns OtbRows + release info. |
| **OtbRow**    | One brand × category at one period. Owns the five OTB inputs + the derived OTB number. See `OTB_CODE_SPEC.md`. |
| **ValuePlan** | Per released OTB row, the buyer's price-tier cascade. See `../value/VALUE_PLAN_SPEC.md`.                 |

## plan_id

```
AP-{YYYYMMDD start}-{YYYYMMDD end}
```

Deterministic from `(plan_start_iso, plan_end_iso)`. Examples:

| Window                       | plan_id                |
| ---------------------------- | ---------------------- |
| FY 2026-27 (Apr 26 – Mar 27) | `AP-20260401-20270331` |
| FY 2024-25 (Apr 24 – Mar 25) | `AP-20240401-20250331` |
| CY 2026 (Jan – Dec 26)       | `AP-20260101-20261231` |
| Q3 26 replan (Jul – Sep)     | `AP-20260701-20260930` |
| 6-month proposal (Apr – Sep) | `AP-20260401-20260930` |

**Uniqueness:** scoped per tenant. Two plans with identical (start, end)
collapse to the same id, so `initAnnualPlan` is **idempotent** — re-init
returns the existing plan, never creates a duplicate. Two plans with
different horizons get different ids and can co-exist.

**Display name** (`AnnualPlan.name`): a friendlier label derived from the
window:

- Apr-start + 12-month horizon ending the following Mar → year only (`2026`)
- Jan-start + 12-month horizon ending Dec same year → year only (`2026`)
- Anything else → `Apr 2026 → Sep 2026` style

**Validation regex (suggested):**
```
^AP-\d{8}-\d{8}$
```

## Data model

```ts
AnnualPlan {
  plan_id: string                    // PK in business terms — see above
  name: string                        // display label
  state: 'draft' | 'submitted' | 'approved'
  overall_budget: number              // ₹ total ceiling Σ OtbRows ≤ this at submit
  plan_start_iso: string              // YYYY-MM-DD
  plan_end_iso: string                // YYYY-MM-DD (inclusive, last day of last period)
  created_at: timestamp
  approved_at?: timestamp             // stamp of Submit (no separate APPROVE step)
  periods: Map<period_key, PeriodPlan>
}

PeriodPlan {
  period_key: string                  // 'YYYY-MM' | 'YYYY-Www' | 'YYYY-Qq'
  state: 'draft' | 'approved' | 'in_progress' | 'locked' | 'skipped'
  rows: OtbRow[]                      // see OTB_CODE_SPEC.md
  baseline_rows?: OtbRow[]            // snapshot of `rows` at first submit
  locked_at?: timestamp
  locked_by?: string
  skipped_at?: timestamp
}
```

## State machine

### AnnualPlan

```
DRAFT ──submitAnnualPlan──► APPROVED
```

Submit cascades: every `DRAFT` PeriodPlan flips to `APPROVED` in the same
write and `baseline_rows = rows.copy()` is snapshotted. There is no
separate APPROVE step. After APPROVED, `overall_budget` and the
brand × category row set are immutable; only per-period release actions
can change state.

### PeriodPlan (after annual is APPROVED)

```
APPROVED ──startRelease──► IN_PROGRESS ──lockPeriod──► LOCKED
                                    │
                                    └────skipPeriod───► SKIPPED   (terminal)

LOCKED ──lockPeriod (again)──► LOCKED                   (re-release)
LOCKED ──(any edit)──► LOCKED (row values changed)      (re-release prep)
```

- **`startRelease`** is dispatched implicitly the first time the planner
  focuses the OTB inputs on the release page. Just a state housekeeping
  hop; UI shows the same view.
- **`lockPeriod`** is the planner's release action. It can be invoked
  again on a `LOCKED` period to re-release after edits. The lead-time
  buffer (`LEAD_TIME_LOCK_BUFFER_DAYS = 5` days) only blocks the *first*
  release — re-releases are allowed regardless of how close we are to
  the period start.
- **`skipPeriod`** is terminal. Skipped periods cannot be revived.

### Buyer handover gate

Once *any* OtbRow inside a LOCKED period has a Value Plan (state =
`DRAFT` / `SUBMITTED` / `APPROVED`), the planner is locked out:

| Planner action | Effect when handover has happened |
| -------------- | --------------------------------- |
| Edit OTB row fields  | Disabled (inputs become read-only) |
| Re-release the period | Hidden — handover is irreversible without first discarding the Value Plan |
| Skip the period       | Hidden                            |

The rule keeps the planner from pulling values out from under a buyer
who's already mid-cascade. To re-edit OTB after handover, the buyer
must explicitly discard the Value Plan first.

## Lead-time rules

| Setting                          | Source                          | Effect |
| -------------------------------- | ------------------------------- | ------ |
| `time_config.lead_time_days`     | Setup                            | Days the brand needs from PO → on-shelf |
| `LEAD_TIME_LOCK_BUFFER_DAYS = 5` | `src/features/otb/constants.ts` | Days subtracted from lead time as a buffer |
| `release_config.lock_deadline_days_before` | Setup                | Days before period-start by which release must happen |

**Effective gate (first release):** `daysToStart < lead_time_days - 5` →
block release. Past the gate the planner can still **skip** the period
but cannot release it for the first time.

**Re-release:** lead-time gate is **not** applied.

## URL structure (frontend ⇄ REST mapping)

These are the URLs the SPA navigates. Each maps cleanly to a REST
endpoint when the backend lands.

| SPA URL                                  | REST verb · endpoint                          | Purpose |
| ---------------------------------------- | --------------------------------------------- | ------- |
| `/otb`                                   | `GET /api/otb/plans`                          | List plans for the tenant |
| `/otb/annual`                            | `POST /api/otb/plans` (lazy)                  | New plan — `plan_id` minted from `(start, end)` |
| `/otb/:planId`                           | `GET /api/otb/plans/{plan_id}`                | Plan detail (period grid) |
| `/otb/:planId/annual`                    | `GET /api/otb/plans/{plan_id}` + edit affordances | Edit Annual Plan (DRAFT only) |
| `/otb/:planId/release/:periodKey`        | `GET /api/otb/plans/{plan_id}/periods/{period_key}` | Release one period |
| `/value`                                 | `GET /api/value/plans` (rolled-up across plans) | Value-plan year list |
| `/value/:planId`                         | `GET /api/value/plans/{plan_id}/rows`         | Released OTB rows for one plan |
| `/value/:planId/:otbCode`                | `GET /api/value/plans/{plan_id}/rows/{otb_code}` | Value Plan editor |

## Uniqueness constraints (DB-ready)

```
UNIQUE (tenant_id, plan_id)
UNIQUE (tenant_id, plan_start_iso, plan_end_iso)
PK: (plan_id, period_key)                                      -- on PeriodPlan
```

## Lazy creation rule

The frontend does **not** create a plan on page-visit. On `/otb/annual`
the page sits in preview mode until the planner does something
meaningful (sets the budget, runs auto-fill, adds a row, hits Submit).
At that point `initAnnualPlan` fires and the URL replaces to
`/otb/:planId/annual`.

**Backend MUST mirror this:** opening the new-plan page should not
materialize a plan record. The first POST (with budget set or any other
real edit) is when the row appears in DB.

A safety net — the plans-list page sweeps **zombie drafts** on mount
(any `DRAFT` plan where `overall_budget = 0 AND Σ rows = 0`) and
deletes them. The same sweep should run on the backend nightly (or on
list-fetch) to keep the table tidy.

## Multi-FY overlap

Real fashion planning runs **two FYs in parallel** for ~3 months at the
end of the calendar year (FY26 still releasing its last 3 periods +
FY27 drafting + first release). The multi-plan model supports this:
`active_plan_id` is **not** stored on the backend or in Redux — the URL
is the source of truth, so two browser tabs can each carry their own
plan id with no conflict.

## API shape (illustrative)

```json
{
  "plan_id": "AP-20260401-20270331",
  "name": "2026",
  "state": "approved",
  "overall_budget": 1200000000,
  "plan_start_iso": "2026-04-01",
  "plan_end_iso": "2027-03-31",
  "created_at": "2026-01-12T08:30:00Z",
  "approved_at": "2026-01-25T17:42:00Z",
  "periods": [
    {
      "period_key": "2026-04",
      "state": "locked",
      "locked_at": "2026-02-08T11:00:00Z",
      "locked_by": "Demo User",
      "rows": [ /* OtbRow[] — see OTB_CODE_SPEC.md */ ]
    },
    { "period_key": "2026-05", "state": "in_progress", "rows": [/* ... */] },
    { "period_key": "2026-06", "state": "approved", "rows": [/* ... */] }
  ]
}
```

## Frontend touch points

- Types: `src/features/otb/types.ts` → `AnnualPlan`, `PeriodPlan`
- Constants: `src/features/otb/constants.ts` → `OTB_STATES`, `LEAD_TIME_LOCK_BUFFER_DAYS`
- Helpers: `src/features/otb/utils/planId.ts` → `buildPlanId`, `buildPlanName`, `derivePlanEndIso`
- Slice: `src/store/slices/otbSlice.ts` (multi-plan map: `state.plans`)
- Hooks: `src/features/otb/useOtb.ts` → `useAnnualPlan(planId)`, `useAllPlans`, `usePeriods(planId)`
- Plans list: `src/features/otb/plans-list/plans-list.component.tsx` (zombie sweep on mount)
- Annual editor (lazy init): `src/features/otb/annual/annual.component.tsx`
- Dashboard (per-plan): `src/features/otb/dashboard/dashboard.component.tsx`
- Release page (handover gate): `src/features/otb/release/release.component.tsx`
