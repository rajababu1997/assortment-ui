# OTB Dashboard — Design Proposal

> Audience: PM + design + engineering team. Goal: align on what we're building before any code starts.

## 1. Decoding the Brief

Your manager said:

> *"We need to also work on the dashboard which is critical for the buyer to see the entire history, wip etc on his screen. (snap shot and detail)"*

In plain English, this maps to **four needs**:

| Need | What it means | Why it matters |
|---|---|---|
| **History** | Past plans + how they actually performed | Buyer learns from prior cycles; finance audits variance |
| **WIP** (Work In Progress) | All in-flight plans by state | Nothing slips through cracks; clear next-action ownership |
| **Snapshot** | Single landing page — "where do I stand right now?" | Buyer opens portal → instantly knows what needs attention |
| **Detail** | Click any number → see underlying plan/row/period | "Trust but verify" — every aggregate is traceable |

---

## 2. Three Personas, Three Lenses

The same dashboard serves three people who care about different things:

### 2.1 The Buyer (primary persona)

| Buyer's daily question | Dashboard answers it via |
|---|---|
| "Am I tracking to plan?" | KPI strip: Committed vs Plan, Open Budget |
| "What needs my attention today?" | Attention strip + WIP queue (drafts due, revisions requested) |
| "Did last year's bet work?" | History timeline + STR/margin trend |
| "When do my POs land?" | Receipt calendar (next 90 days) |
| "Which category is underperforming?" | Plan-vs-Actual heatmap |

### 2.2 The Finance Member (secondary)

| Finance question | Dashboard answers it via |
|---|---|
| "How much of the FY budget is locked vs free?" | Budget consumption ring (Committed · Open · Spent) |
| "Where's the variance vs plan?" | Variance heatmap; drill to root cause |
| "When does cash leave?" | PO commitment schedule (when do receipts cost us?) |
| "What's the markdown exposure?" | MD% trend with red threshold flag |

### 2.3 The Senior Product Designer / Brand Head (oversight)

| Brand head question | Dashboard answers it via |
|---|---|
| "Is my brand-mix moving the right direction?" | Brand × Category × Band volume distribution |
| "Which buyer is on top of their game?" | Buyer scorecard (only senior view) |
| "Are we over-rotating to discounts again?" | YoY markdown % strip |
| "What's the pipeline look like next quarter?" | Forward-looking inventory cover chart |

**Design implication:** A single layout serves all three via persona-aware filters (default views by role) — not three separate dashboards.

---

## 3. Information Architecture — The 3 Tiers

```
┌────────────────────────────────────────────────────────────────┐
│  TIER 1: SNAPSHOT (landing — 1 screen, no scroll)              │
│   • Attention strip                                            │
│   • KPI snapshot (5–6 tiles)                                   │
│   • Plan-health heatmap (months × categories)                  │
│   • WIP queue (left col) + Performance highlights (right col)  │
└────────────────────────────────────────────────────────────────┘
                              ▼ (scroll down OR click)
┌────────────────────────────────────────────────────────────────┐
│  TIER 2: MID-LEVEL LISTS / TRENDS                              │
│   • History timeline (12–24 months plan vs actual)             │
│   • Receipt calendar (next 90 days)                            │
│   • Top movers / laggards table                                │
│   • Vendor / sourcing snapshot (if multi-vendor)               │
└────────────────────────────────────────────────────────────────┘
                              ▼ (click any row)
┌────────────────────────────────────────────────────────────────┐
│  TIER 3: DETAIL DRILL (single plan / row / period)             │
│   • Plan-level audit trail (versions, approvers, comments)     │
│   • Per-row P&L: planned → actual → variance                   │
│   • Activity feed (who did what when)                          │
└────────────────────────────────────────────────────────────────┘
```

---

## 4. Tier 1: The Snapshot (Landing Page)

The single most important screen. Buyer should hit `/dashboard` and within 5 seconds know:

1. Is anything on fire?
2. Where do I stand financially?
3. Where am I winning / losing?
4. What's my next action?

### 4.1 Top: Attention Strip

A red-band ribbon at the top with **action-needed signals**. Hide if empty (don't show "all clear" — it'd be noise).

| Trigger | Example message | Click action |
|---|---|---|
| Plan stuck in review > 3 days | "Option Plan OTB-2026-01-PUMA-ATHL has been awaiting designer review for 4 days" | → opens the plan |
| OTB row over-budget | "2 OTB rows over-allocated by ₹15L combined" | → filters list to those rows |
| Stockout flag | "3 SKUs are stocked out — Wedding season starts in 12 days" | → opens inventory view |
| Revisions requested | "5 plans need your revisions" | → opens revisions list |
| Approval queue (for designers/finance) | "8 plans awaiting your approval" | → opens approval queue |

### 4.2 KPI Snapshot (5 tiles, headline numbers)

Each tile shows: **value · YoY delta · drill arrow**.

| Tile | Formula | Why it matters |
|---|---|---|
| **Plan Year Budget** | sum of all annual plan budgets for current FY | Anchor — everything else compared to this |
| **Committed** | Σ released OTB across all plans | What's locked in |
| **Open** | Plan Year Budget − Committed | Cash still flexible |
| **STR YTD** | weighted avg sell-through across released OTB | Are we clearing inventory? |
| **Margin YTD** | weighted avg realized GP% | Are we making money? |
| **Markdown YTD** | total markdown ÷ total gross sales | Are we over-discounting? |

Each tile is clickable → drills to its data source.

### 4.3 Plan-Health Heatmap (months × categories)

A grid where:
- Rows = brand × category combinations (Puma-Athleisure, Tommy-Iconic, etc.)
- Columns = 12 months of the plan year
- Cell color = variance bucket:
  - 🟢 **Green** — within ±5% of plan
  - 🟡 **Yellow** — 5-15% off plan
  - 🔴 **Red** — > 15% off plan
  - ⬜ **Gray** — not yet released / future months

Hover a cell → tooltip with planned, actual, variance, top driver.
Click a cell → drill to that (brand × cat × month).

```
                  Jan  Feb  Mar  Apr  May  Jun  Jul  Aug  Sep  Oct  Nov  Dec
Puma · Athleisure  🟢   🟢   🟡   🟢   🟡   🔴   ⬜   ⬜   ⬜   ⬜   ⬜   ⬜
Puma · Casual      🟢   🟢   🟢   🟢   🟢   🟡   ⬜   ⬜   ⬜   ⬜   ⬜   ⬜
Tommy · Classic    🟡   🔴   🔴   🟢   🟢   🟢   ⬜   ⬜   ⬜   ⬜   ⬜   ⬜
Tommy · Iconic     🟢   🟢   🟢   🟡   🟢   🟢   ⬜   ⬜   ⬜   ⬜   ⬜   ⬜
```

### 4.4 Left Column: WIP Queue

A vertical list of in-flight plans **grouped by state**, sorted by age (oldest first — visibility prevents stuck items).

```
WIP (12)
─────────────────────────────────────────────
DRAFT — your action (4)
  • Annual Plan AP-2027-FY · 2 days old
  • Value Plan OTB-2026-07-PUMA-ATHL · 3 days
  • Value Plan OTB-2026-08-PUMA-CSL · 1 day
  • Option Plan OTB-2026-01-TOMMY-ICONIC · 5 days

SUBMITTED — awaiting designer (3)
  • Option Plan OTB-2026-02-PUMA-ATHL · 4 days  ⚠ stuck
  • Option Plan OTB-2026-03-PUMA-CSL · 1 day
  • Value Plan OTB-2026-04-TOMMY-CLASSIC · 2 days

REVISIONS REQUESTED — your action (2)
  • Option Plan OTB-2026-01-PUMA-CSL · 1 day
  • Value Plan OTB-2026-02-TOMMY-ICONIC · just now

APPROVED — ready to release (3)
  • Annual Plan AP-2026-FY  ✓ released
  • Value Plan OTB-2026-01-PUMA-ATHL  ⏳ not released
  • Option Plan OTB-2026-01-PUMA-ATHL  ⏳ not released
```

Each line: title · age · primary action button.
Stuck items (> 3 days in same state) get a ⚠ flag.

### 4.5 Right Column: Performance Highlights

```
TOP MOVERS (LY-equivalent week)
  1. Tommy Iconic / Statement       +28%  ↑ 71% STR
  2. Puma Athleisure / Core         +15%  ↑ 65% STR
  3. Zara Dresses / Upper           +12%  ↑ 62% STR

LAGGARDS / WATCHLIST
  1. Tommy Classic / Statement      −34%  ↓ 31% STR  · 22d cover
  2. Puma Sports / Entry            −18%  ↓ 38% STR  · MD 28%
  3. Zara Men's Shirts / Upper      −12%  ↓ 41% STR  · 18d cover

INVENTORY ALERTS
  • 3 SKUs stocked out > 7 days
  • 5 categories over 8 weeks of cover
```

---

## 5. Tier 2: Mid-Level (History, Calendar, Lists)

When the buyer scrolls down (or clicks "View all") from snapshot tiles.

### 5.1 History Timeline

A horizontal ribbon showing the last **12–24 months** of plan vs actual.

```
                          Plan ($)      Actual ($)     Variance
2025 Q1                    ████████      █████████      +5%   🟢
2025 Q2                    ████████      ███████        -8%   🟡
2025 Q3                    █████████     ██████████     +6%   🟢
2025 Q4                    ████████████  ██████████     -12%  🟡
2026 Q1 (in progress)      ████████      █████          (62% complete) ⏳
2026 Q2 (planned)          █████████     (n/a)          (not started)
```

Hover → tooltip with breakdown by category.
Click → drill to that quarter.

### 5.2 Receipt Calendar (Pipeline)

Next 90 days. When do POs land?

```
WEEK              VALUE         CATEGORIES               STATUS
Jul 7  - 13       ₹84 L         Puma-ATHL, Tommy-CL       ✓ on track
Jul 14 - 20       ₹1.2 Cr       Puma-CSL, Zara            ⚠ 1 delayed
Jul 21 - 27       ₹95 L         All                       ✓ on track
Jul 28 - Aug 3    ₹70 L         Tommy                     ⏳ awaiting confirm
…
```

Click a week → see individual POs landing.
Filter by brand / category / vendor.

### 5.3 Plan History List

A searchable, filterable list of every plan ever created.

| Columns |
|---|
| Plan code · Type (Annual/Value/Option) · State · Brand · Category · Period · Owner · Created · Last updated · Budget · Actual · Variance % |

Filters: state, brand, category, period range, owner.
Default sort: most recent first.
Click a row → Tier 3 detail.

### 5.4 Variance Deep Dive Table

A pivot-style table for finance:

| Brand × Category | Plan Q1 | Actual Q1 | Var Q1 | Plan Q2 | Actual Q2 | Var Q2 | … YoY |
|---|---|---|---|---|---|---|---|
| Puma · Athleisure | 1.2 Cr | 1.26 Cr | +5% | 1.4 Cr | 1.29 Cr | -8% | +12% |
| Puma · Casual | 0.8 Cr | 0.79 Cr | -1% | 0.9 Cr | 0.94 Cr | +4% | +9% |
| ... | | | | | | | |

Exportable to CSV for finance reporting.

---

## 6. Tier 3: Detail Drill-Down

When buyer clicks any specific row, get a full single-plan view.

### 6.1 Plan Header

- Plan code, type, state badge
- Owner + designer + last action
- Audit timeline (when it moved through DRAFT → SUBMITTED → APPROVED)
- Quick actions (Edit / Submit / Approve / Request Revisions)

### 6.2 Per-Row P&L Strip

Planned, Actual (if released), Variance for each of the 5 OTB fields:

| | Planned Sales | Markdowns | EOM | BOM | On Order | OTB |
|---|---:|---:|---:|---:|---:|---:|
| Plan | 2.6 Cr | 30.7 L | 70.9 L | 60.1 L | 0 | 3.01 Cr |
| Actual | 2.4 Cr | 42.0 L | 88.5 L | 60.1 L | 18 L | 3.18 Cr |
| Variance | -8% | +37% | +25% | 0% | +18 L | +6% |

Highlight cells > ±10% in red.

### 6.3 Activity Feed

Chronological log:

```
Oct 5  · Buyer A     · saved draft
Oct 7  · Buyer A     · submitted for review
Oct 8  · Designer B  · requested revisions ("rework Entry band MRP")
Oct 9  · Buyer A     · saved revised draft
Oct 9  · Buyer A     · re-submitted
Oct 10 · Designer B  · approved
Oct 12 · System      · released
Oct 14 · System      · 1 PO placed (₹40L)
Oct 30 · System      · first receipts in
```

### 6.4 Linked Plans

Show the cascade — this OTB row's Annual Plan, Value Plan, Option Plan. Click to navigate up/down the chain.

### 6.5 Comments / Conversation Thread

Already exists in option-editor. Promote to all plan types.

---

## 7. Cross-Cutting Features

### 7.1 Personalisation

- **Buyer default view:** their own plans + their categories
- **Finance default view:** all plans, focus on variance + cash flow
- **Brand head default view:** brand-rollup, no individual plan noise

Persona toggle in header switches default filters.

### 7.2 Time-Range Selector

Universal control at the top:
- This Quarter | YTD | Last 6 Months | Last 12 Months | Custom

Affects KPI strip, heatmap, history timeline simultaneously.

### 7.3 Brand × Category Filter

Multi-select chips for buyers managing multiple categories.
Persists in URL so dashboards are shareable.

### 7.4 Notifications / Subscriptions

- Email digest at 8am: "Yesterday's WIP movement + today's required actions"
- In-app toast for: revisions requested, plan approved, PO delayed
- Subscribe to specific OTB rows (the row that's giving you trouble)

### 7.5 Export / Share

- Export any list to CSV
- Export the whole snapshot as PDF (for monthly review meetings)
- Share a deep link with filters preserved

---

## 8. Data the Backend Must Provide

Most of this exists. What's missing:

| Endpoint needed | Returns | Why |
|---|---|---|
| `GET /dashboard/snapshot?fy=2026` | KPI rollups (budget, committed, open, STR YTD, MD YTD) | Tier 1 KPI strip |
| `GET /dashboard/heatmap?fy=2026` | Per (brand×cat×month) plan + actual variance | Plan health heatmap |
| `GET /dashboard/wip?owner=me` | All in-flight plans by state | WIP queue |
| `GET /dashboard/movers?period=ly_week` | Top/bottom 5 by STR delta | Performance highlights |
| `GET /dashboard/receipts?from=…&to=…` | Receipt calendar pipeline | Tier 2 calendar |
| `GET /dashboard/history?from=…&to=…` | Quarterly rollups | History timeline |
| `GET /dashboard/activity?planUuid=…` | Audit log for one plan | Tier 3 activity feed |

**Already exist:** `/sales/*` (aggregate, attribute, kpi, monthly), `/otb/*` (plans, rows, value, option), `/recommendation/*`.

**Net new effort:** dashboard aggregation endpoints — mostly reads over existing tables. ~1 sprint to spec + build.

---

## 9. Phased Rollout (MVP → V2)

### Phase 1 — MVP (2 weeks)

Bare minimum to make the brief real:

- ✅ KPI snapshot (6 tiles)
- ✅ WIP queue (grouped by state)
- ✅ Plan history list (filterable table)
- ✅ Persona toggle (buyer / finance / brand head defaults)

**This alone answers 70% of "where do I stand?" questions.**

### Phase 2 — Operational Depth (3-4 weeks)

- ✅ Plan-health heatmap
- ✅ History timeline (12-month plan vs actual ribbon)
- ✅ Performance highlights (top movers / laggards)
- ✅ Tier 3 detail drill (audit + activity)

### Phase 3 — Forward Visibility (3-4 weeks)

- ✅ Attention strip (alerts engine)
- ✅ Receipt calendar
- ✅ Variance deep-dive pivot table
- ✅ Notification digests + subscriptions

### Phase 4 — Polish (ongoing)

- Saved views ("My Q4 watchlist")
- AI-narrative summaries ("Tommy Iconic is leading the brand because…")
- Exec PDF report
- Predictive alerts ("Likely stockout in 14 days at current run rate")

---

## 10. Open Questions to Resolve Before Coding

Get these answered in a 30-minute alignment meeting with PM + manager + design lead:

1. **"Variance" definition** — is variance vs planned, vs LY, or both?
2. **Who owns notifications?** — email infra in place, or do we ship in-app only?
3. **Is there a single source of "actual" sales?** — or do we calculate from POS feeds?
4. **Multi-tenant scoping** — do brand heads see across tenants, or one tenant at a time?
5. **Mobile?** — phones for buyers walking the floor, or desktop-only?
6. **Permission model** — can buyers see each other's plans, or only theirs?
7. **Data freshness** — real-time, hourly, or daily refresh?

---

## 11. Visual Mockup (Wireframe)

```
┌───────────────────────────────────────────────────────────────────────────┐
│ ☰  OTB Dashboard           [Brand: All ▾]  [FY: 2026 ▾]   👤 Buyer A   ⚙  │
├───────────────────────────────────────────────────────────────────────────┤
│ ⚠  3 plans awaiting your action · 2 stuck in review > 3 days · 1 stockout │
├───────────────────────────────────────────────────────────────────────────┤
│ ╔══════════╦══════════╦══════════╦══════════╦══════════╦══════════╗     │
│ ║ Plan Yr  ║ Committed║   Open   ║ STR YTD  ║ Margin   ║ Markdown ║     │
│ ║ ₹120 Cr  ║ ₹68 Cr   ║ ₹52 Cr   ║  61.3%   ║  68.9%   ║  10.8%   ║     │
│ ║ +12% YoY ║ 57% done ║ 43% open ║ +2.1 pp  ║ -0.4 pp  ║ +1.2 pp ⚠║     │
│ ╚══════════╩══════════╩══════════╩══════════╩══════════╩══════════╝     │
├───────────────────────────────────────────────────────────────────────────┤
│ Plan Health                                                               │
│              Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec               │
│ PUMA·ATHL    🟢  🟢  🟡  🟢  🟡  🔴  ⬜  ⬜  ⬜  ⬜  ⬜  ⬜               │
│ PUMA·CSL     🟢  🟢  🟢  🟢  🟢  🟡  ⬜  ⬜  ⬜  ⬜  ⬜  ⬜               │
│ TOMMY·CLS    🟡  🔴  🔴  🟢  🟢  🟢  ⬜  ⬜  ⬜  ⬜  ⬜  ⬜               │
│ TOMMY·ICN    🟢  🟢  🟢  🟡  🟢  🟢  ⬜  ⬜  ⬜  ⬜  ⬜  ⬜               │
├───────────────────────────────────────────┬───────────────────────────────┤
│ WIP (12)                                  │ TOP MOVERS                    │
│ ▸ DRAFT — your action (4)                 │ 1. Tommy Iconic / Stmnt +28%  │
│ ▸ SUBMITTED — awaiting designer (3)       │ 2. Puma ATHL / Core      +15% │
│ ▸ REVISIONS — your action (2)             │ 3. Zara Dresses / Upper  +12% │
│ ▸ APPROVED — ready to release (3)         │                               │
│                                           │ LAGGARDS                      │
│                                           │ 1. Tommy CLS / Stmnt    -34%  │
│                                           │ 2. Puma Sports / Entry  -18%  │
│                                           │ 3. Zara Men's / Upper   -12%  │
│                                           │                               │
│                                           │ ALERTS                        │
│                                           │ • 3 SKUs stocked out > 7d     │
│                                           │ • 5 cats > 8w cover           │
└───────────────────────────────────────────┴───────────────────────────────┘
```

(Below the fold: history timeline → receipt calendar → variance pivot → settings.)

---

## 12. Recommendation

**Build Phase 1 first** (KPI tiles + WIP queue + filtered plan history) — 2 weeks of work answers the majority of "what's going on?" questions and proves out the dashboard pattern. Then layer Phase 2 (heatmap + history ribbon) after collecting buyer feedback.

Don't build Phases 3-4 speculatively — wait for real complaints about missing info. Most retail dashboards I've seen die from feature creep, not feature gaps.

---
*Document owner: Product. Last updated 2026-06-30. Reviewers: Design, Eng lead, Finance, Brand head.*
