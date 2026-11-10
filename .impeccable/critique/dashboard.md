---
target: "frontend/src/pages/farms/FarmingLogPage.jsx"
total_score: 24
max_score: 40
na_heuristics: ""
p0_count: 0
p1_count: 2
p2_count: 2
p3_count: 0
date: "2026-11-10T12:00:00.000Z"
---

# Design Critique: Dashboard (FarmingLogPage)
Target: `frontend/src/pages/farms/FarmingLogPage.jsx`

### Heuristics Table
| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Offline sync banner & toasts work well, lacks skeleton loaders during initial fetch |
| 2 | Match System / Real World | 3 | Authentic Vietnamese agricultural terminology, minor dev/code leakage (`unassigned_plot_...`) |
| 3 | User Control and Freedom | 2 | Relies on browser `window.confirm()` for delete with no Undo ("Hoàn tác") action |
| 4 | Consistency and Standards | 2 | Orphaned KPI styles in CSS not rendered in JSX; scattered inline styles with legacy `#107C10` |
| 5 | Error Prevention | 3 | Good inventory & season guards, but lacks auto-saving form drafts |
| 6 | Recognition Rather Than Recall | 2 | Missing high-level KPI cards forces mental math to track season investment |
| 7 | Flexibility and Efficiency | 2 | Great OCR/Today shortcuts, but long form causes vertical fatigue without batch actions |
| 8 | Aesthetic and Minimalist Design | 2 | Dense stacked form competes with history table; visual imbalance |
| 9 | Error Recovery | 3 | Plain language errors in toasts, but fleeting (disappear after 6s) |
| 10 | Help and Documentation | 2 | Helpful modals/tooltips exist, but no onboarding or quick field guide for elder farmers |
| **Total** | | **24/40** | **Acceptable** |

### Priority Issues
- **[P1] Missing Dashboard KPI Stat Cards & Financial Ledger Overview**: `FarmingLogPage.jsx` does not render any KPI cards (Total Investment, Labor Cost, Materials Cost, Harvest Revenue, Net Profit/Loss), leaving the CSS `.kpi-grid` orphaned.
- **[P1] Cognitive Overload in Single-Page Logging Form**: All fields (Plot, Season, Activity, Date, Shift, Time, Materials, Inventory Stock, Labor Wages, Other Costs, Notes) are rendered simultaneously in a single long scroll.
- **[P2] Scattered Inline Styles and Hardcoded Fallbacks**: Multiple JSX elements use inline styles with `var(--ms-green, #107C10)` instead of referencing the design token `#137a3a` or CSS classes.
- **[P2] Destructive Action Safety & Missing Undo**: Deleting a log uses browser `window.confirm()` and permanently deletes without an Undo buffer.
