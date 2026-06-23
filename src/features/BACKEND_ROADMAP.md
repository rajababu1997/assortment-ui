# Backend Roadmap — Assortment Planning

Sequenced plan for the `qa_server_inspect` / `qa_server_common` backend
to catch up with the assortment_ui frontend. Each phase is **shippable
on its own** — the UI keeps using mock JSON for any phase that hasn't
landed yet, so backend and frontend can stay decoupled.

> Spec docs (read in this order):
> 1. [`otb/ANNUAL_PLAN_SPEC.md`](./otb/ANNUAL_PLAN_SPEC.md) — top of the tree
> 2. [`otb/OTB_CODE_SPEC.md`](./otb/OTB_CODE_SPEC.md) — business identifier
> 3. [`otb/CATEGORY_BANDS_SPEC.md`](./otb/CATEGORY_BANDS_SPEC.md) — master data
> 4. [`value/VALUE_PLAN_SPEC.md`](./value/VALUE_PLAN_SPEC.md) — downstream Step 2

## Out of scope

| Area | Why |
| ---- | --- |
| **OTB Setup wizard** (time/lead-time/release config) | Frontend-only, stored in LocalStorage. No backend table needed. |
| **Demo clock** (`useDemoToday`, `setDemoToday`) | UI-only mimic. Server uses real time; the gates that depend on "today" should accept the client's "as-of" date in the request body so demos still work, but no persistence. |
| **Sign-in / tenant context** | Already wired in `qa_server_inspect`. Reuse the existing filter. |

## Sequencing principle

Build **bottom-up by data dependency**, not by user-facing screen:

```
Master data  →  Annual Plan shell  →  OTB rows  →  Release lifecycle
                                                          ↓
                                                     Value Plan
                                                          ↓
                                              Handover gate & staleness
```

You cannot create an OTB row without a brand+category. You cannot release
a period without OTB rows. You cannot start a Value Plan without a LOCKED
period. Each phase unlocks the next.

---

## Phase 0 — Foundation (½ day)

Plumbing only. No business endpoints yet.

| Task | Notes |
| ---- | ----- |
| Confirm DB (assumed Postgres, same instance as qa_server_inspect) | New schema `assortment` |
| Migration tool | Reuse whatever qa_server_inspect uses (Flyway / Liquibase) |
| Common error envelope | `{ code, message, fields? }` — mirror what other endpoints return |
| Tenant filter | Reuse existing `tenant_id` resolution from session |
| OpenAPI / Swagger scaffold | One spec file, grow per phase |

**Done when:** an empty `GET /api/assortment/health` returns 200 inside the
tenant filter chain.

---

## Phase 1 — Master data: Brand + Category + Bands (1 day)

Read-only for now. Bands are the price ladder Step 2 splits the budget
across, so everything downstream needs them.

| Task | Spec ref |
| ---- | -------- |
| Tables `brands`, `categories`, `category_bands` (or `bands` JSONB column on `categories`) | `CATEGORY_BANDS_SPEC.md` |
| Seed migration from `mockData/brands.ts → SEED_CATEGORIES` | Copy as-is |
| `GET /api/brands` (tenant-scoped list) | — |
| `GET /api/categories?brand_id=` (with bands embedded) | — |
| `GET /api/categories/{id}` | — |
| Validate invariants on write (length 4, ids unique, MRP non-overlapping) | `CATEGORY_BANDS_SPEC.md → Invariants` |

**Done when:** the brand/category picker in `PeriodEditor.tsx` can fetch
from the API instead of `SEED_CATEGORIES`. (Frontend swap is a small
wrapper around `useBrands` / `useCategories`.)

**Skip for v1:** admin CRUD for bands. Merch team can edit seed
migrations until v2.

---

## Phase 2 — Annual Plan shell (1–2 days)

The skeleton: create plans, list plans, fetch a plan, delete a plan.
**No OTB rows yet.**

| Task | Spec ref |
| ---- | -------- |
| Tables `annual_plans` (PK `plan_id`, `tenant_id`, `name`, `state`, `overall_budget`, `plan_start_iso`, `plan_end_iso`, timestamps) and `period_plans` (PK `(plan_id, period_key)`, `state`, `locked_at`, `locked_by`, `skipped_at`) | `ANNUAL_PLAN_SPEC.md → Data model` |
| `plan_id` generator (mirror `buildPlanId` in `utils/planId.ts`) | `ANNUAL_PLAN_SPEC.md → plan_id` |
| Unique constraints `(tenant_id, plan_id)` and `(tenant_id, plan_start_iso, plan_end_iso)` | Same spec |
| `POST /api/otb/plans` — **idempotent** (re-POST with same window returns existing) | `ANNUAL_PLAN_SPEC.md → Lazy creation rule` |
| `GET /api/otb/plans` — list for tenant | — |
| `GET /api/otb/plans/{plan_id}` — detail with empty periods | — |
| `DELETE /api/otb/plans/{plan_id}` — for plan reset | — |
| **Zombie sweep**: nightly job OR on-list-fetch — delete DRAFT plans where `overall_budget = 0 AND Σ rows = 0` | `ANNUAL_PLAN_SPEC.md → Lazy creation rule` |

**Done when:** plans-list (`/otb`) and the lazy annual editor
(`/otb/annual` → `/otb/:planId/annual`) work end-to-end against the API.

**Critical:** **do not** materialize a plan on GET. The first write (with
budget or any real edit) is when the row appears. Otherwise zombies
accumulate.

---

## Phase 3 — OTB rows + `otb_code` (2 days)

Now the plan can carry brand × category rows per period. This is where
the picker, the auto-fill, and CSV import all land.

| Task | Spec ref |
| ---- | -------- |
| Table `otb_rows` (`row_id` PK, `plan_id`, `period_key`, `brand_id`, `category_id`, `otb_code`, five OTB inputs, derived `otb_amount`) | `OTB_CODE_SPEC.md → API shape` |
| Unique `(plan_id, period_key, brand_id, category_id)` and `(plan_id, otb_code)` | `OTB_CODE_SPEC.md → Uniqueness constraint` |
| `otb_code` generator (mirror `buildOtbCode`) | `OTB_CODE_SPEC.md → Format` |
| `PUT /api/otb/plans/{plan_id}/periods/{period_key}/rows/{row_id}` (upsert) | — |
| `DELETE .../rows/{row_id}` | — |
| `POST /api/otb/plans/{plan_id}:submit` — cascade DRAFT periods → APPROVED, snapshot `baseline_rows`, stamp `approved_at` | `ANNUAL_PLAN_SPEC.md → State machine` |
| Plan-level validation on submit: `Σ rows.otb_amount ≤ overall_budget` | — |

**Done when:** create plan → set budget → add rows → submit works against
the API. The dashboard renders periods read from the server.

---

## Phase 4 — Release lifecycle per period (1 day)

Per-period state machine. The handover gate (Phase 6) builds on this.

| Task | Spec ref |
| ---- | -------- |
| `POST .../periods/{period_key}:start-release` (APPROVED → IN_PROGRESS — also idempotent on focus) | `ANNUAL_PLAN_SPEC.md → State machine` |
| `POST .../periods/{period_key}:lock` (IN_PROGRESS → LOCKED, also LOCKED → LOCKED for re-release) | Same |
| `POST .../periods/{period_key}:skip` (APPROVED/IN_PROGRESS → SKIPPED, terminal) | Same |
| **Lead-time gate** on first lock only: `daysToStart < lead_time_days - 5` → 409 | `ANNUAL_PLAN_SPEC.md → Lead-time rules` |
| Re-release skips the lead-time gate | Same |
| Accept `as_of_date` in request body so demo-clock mimic still works | (Out-of-scope-table above) |
| Editing OTB row on a LOCKED period is **allowed** until handover (Phase 6) | — |

**Done when:** release page works including re-release and skip flows.

---

## Phase 5 — Value Plan (2 days)

Step 2. Keyed by `(plan_id, otb_code)`, only valid when the parent OTB
period is LOCKED.

| Task | Spec ref |
| ---- | -------- |
| Tables `value_plans` (PK `(plan_id, otb_code)`, `period_key`, `brand_id`, `category_id`, `budget_snapshot`, `state`, timestamps) and `value_plan_bands` (FK + `band_id`, `budget_pct`, `avg_mrp`, `avg_cost`) | `VALUE_PLAN_SPEC.md → Data model` |
| `GET /api/value/plans/{plan_id}/rows` — released OTB rows for the plan | — |
| `GET /api/value/plans/{plan_id}/rows/{otb_code}` — VP detail incl. derived | — |
| `PUT .../rows/{otb_code}` — draft save | — |
| `POST .../rows/{otb_code}:submit` — runs hard validation, flips to APPROVED, snapshots `budget_snapshot = current OTB ceiling` | `VALUE_PLAN_SPEC.md → Validation` |
| Compute derived fields server-side and return under `derived` | `VALUE_PLAN_SPEC.md → Derived fields` |
| Reject creating a VP when parent period state ≠ LOCKED | `VALUE_PLAN_SPEC.md → Relationship to Step 1` |

**Done when:** the VP editor + the released-OTB-rows list work against
the API.

---

## Phase 6 — Handover gate & staleness (½ day)

Cross-resource invariants that depend on both Step 1 and Step 2 being
live, so they go last.

| Task | Spec ref |
| ---- | -------- |
| **Handover gate**: once any VP exists in a period (any state), reject `PUT row`, `:lock` (re-release), and `:skip` on that period with 409 + `{ code: "PERIOD_HANDED_OVER" }` | `ANNUAL_PLAN_SPEC.md → Buyer handover gate` + `VALUE_PLAN_SPEC.md → Handover gate` |
| **Stale flag**: at read time, compute `stale = (value_plan.budget_snapshot != current_otb_amount)` and include in response. Not a column. | `VALUE_PLAN_SPEC.md → Staleness rule` |
| VP submit re-snapshots `budget_snapshot = new_ceiling` and clears stale | Same |

**Done when:** trying to edit an OTB row after handover returns 409;
re-releasing the period is blocked; the UI banner ("OTB budget changed
from ₹X to ₹Y") fires correctly.

---

## Phase 7 — Polish (open-ended, prioritise as needed)

| Task | Notes |
| ---- | ----- |
| Audit log for state transitions and releases | Append-only table; useful for the merchandiser handoff trail |
| CSV export with `otb_code` in column 1 | Spec already calls this out |
| Search/filter on `otb_code` substring | Already in UI, needs server-side index |
| Pagination on plans list | Only if a tenant ends up with > 50 plans |

---

## Open questions to confirm before Phase 2

1. **Tenant model** — single-tenant DB per company, or multi-tenant with
   `tenant_id` column? (Frontend doesn't care; backend invariants do.)
2. **`plan_id` collision across tenants** — global unique, or `(tenant_id, plan_id)`? Spec assumes the latter.
3. **Soft delete vs hard delete** for zombie sweep — does compliance need
   the row history?
4. **Time zone** for `period_key` boundaries — IST-only is fine for v1,
   but state explicitly so a future US tenant doesn't break things.

Answer these before kicking off Phase 2; everything downstream depends
on them.

---

## Cadence suggestion

| Week | Phases | Frontend can stop mocking |
| ---- | ------ | ------------------------- |
| W1   | 0, 1   | Master data               |
| W2   | 2, 3   | Annual plan + OTB rows    |
| W3   | 4, 5   | Release lifecycle + VP    |
| W4   | 6, 7   | Handover/staleness + polish |

~4 weeks for one engineer to land Phases 0–6. The frontend stays
shippable throughout because the swap is per-resource.
