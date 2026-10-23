# Machilipatnam Political Intelligence Dashboard

An interactive, responsive React dashboard for the **Machilipatnam Lok Sabha constituency (PC 11), Andhra Pradesh**.
It covers constituency facts, Lok Sabha results (2009–2024), the seven Assembly segments (2009–2024) and calculated
electoral indicators. Frontend only: no backend, no database.

## Technology stack

| Area | Choice | Why |
|---|---|---|
| Framework | React 18 + TypeScript + Vite | Fast dev server, typed data model |
| UI components | react-bootstrap 2 + Bootstrap 5 CSS | Accessible, responsive grid, tables, forms, navbar |
| Styling | Two plain CSS files (`styles/theme.css`, `styles/layout.css`) | Design tokens and layout kept outside components |
| Charts | Recharts | Declarative, works with React state |
| Routing | React Router (HashRouter) | Works on any static host or GitHub Pages without server config |
| Tests | Vitest + React Testing Library | Calculations, filters, error/missing-data handling |

## Setup and run

Requires Node.js 18 or newer.

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # type-check + production build into dist/
npm run preview      # serve the production build
```

## Tests

```bash
npm run test:run     # run once
npm test             # watch mode
npm run typecheck
```

The suite checks: the formulas (vote share, margin, margin %, turnout) against real figures, summaries built from the real dataset,
missing/invalid data handling, table search/sort/pagination, rendering with the dataset, filters changing tables, loading and error
states with retry, the "no result" message, and rendering at 375 / 768 / 1280 px widths.
jsdom has no real layout, so the visual responsiveness (CSS breakpoints, scrolling tables, collapsing navbar) should also be
checked in browser dev tools.

## Project structure 

```
public/data/            Static JSON "mock API" (constituency, parliament, assembly)
src/
  types/                TypeScript data model
  services/api.ts       ONLY place that calls fetch; normalize.ts cleans bad data
  utils/calculations.ts ALL electoral formulas (single source of truth)
  utils/format.ts       number/percent formatting, "Unavailable" text
  hooks/useAsync.ts     loading / error / ready state
  context/              DataContext (loads data) and FilterContext (shared filters)
  components/common/    KpiCard, ChartCard, DataTable, YearFilter, StatusMessage, SourceNote, ShareCell, PartyBadge
  components/layout/    NavBar
  pages/                Overview, Parliament, Assembly, Trends (one per module)
  styles/               theme.css, layout.css
  test/                 Vitest suites
```

Module mapping: Module 1 = Overview, Module 2 = Lok Sabha results, Module 3 = Assembly explorer, Module 4 = Trends & indicators,
Module 5 = navigation, filters, search/sort/pagination, status states and responsive layout across all pages.

## Data sources and data access

All data is in `public/data/*.json` and loaded through `src/services/api.ts`. Swapping in a real API only requires changing that file.
Nothing is fabricated. Missing values are `null` and displayed as **Unavailable**.

* Lok Sabha results 2009, 2014, 2019, 2024: Wikipedia's Machilipatnam Lok Sabha page, whose tables cite Election Commission of India results.
  Cross-checked against Deccan Herald and India TV.
* Assembly results 2009, 2014, 2019, 2024: Wikipedia pages of the seven Assembly constituencies. 2024 results for Pedana and Gannavaram
  were verified against official ECI pages (results.eci.gov.in).
* Assembly segment list, mandals and delimitation: ECI Delimitation Order 2008 (via Wikipedia).
* Electors by segment: CEO Andhra Pradesh, Electors Summary of 25 March 2019 (via Wikipedia).
* Full URLs are listed in the `sources` array of each JSON file and are shown under the relevant tables on the dashboard.

**Please verify against ECI before submitting if you can.** Wikipedia is a secondary source, so the README, UI and JSON all say so.
Official data: https://results.eci.gov.in and https://www.eci.gov.in (Statistical Reports).

## Calculation methodology

All formulas are in `src/utils/calculations.ts`:

* Vote share (%) = candidate votes ÷ total votes counted × 100
* Winning margin (votes) = winner votes − runner-up votes (NOTA is never a winner or runner-up)
* Winning margin (%) = margin ÷ total votes counted × 100
* Turnout (%) = votes polled ÷ registered electors × 100
* Change in vote share = later share − earlier share, in percentage points

When a denominator is missing, the dashboard shows the value printed by the source and marks it with **†**.

## Known limitations and assumptions

* **Demographics are unavailable.** The Census publishes by district and sub-district, not by Parliamentary Constituency, so population,
  sex ratio, rural/urban, literacy and SC/ST fields are shown as "Unavailable" with reference year 2011. Add verified figures in
  `public/data/constituency.json` and they will appear automatically.
* **Electors** are available for 2019 only (PC and segments). Turnout for other years is the figure printed by the source (†).
* **Candidates**: only the candidates listed in the sources are included (top 3 to 5), not every candidate. Shares for minor candidates may be missing.
* **Denominator**: "total votes counted" is the figure listed by the source. The ECI uses total valid votes, so computed shares can differ by
  up to about 0.15 percentage points (for example, 2024 margin 16.97% computed vs 17.01% reported).
* **Source conflicts** (documented in each election's `note` field): 2019 PC totals differ slightly between sources; Machilipatnam AC 2019 runner-up
  (60,290 vs 62,232); Avanigadda AC 2019 total votes; Gudivada AC 2014 winner share. The more internally consistent value was used.
* Segment-wise Lok Sabha vote counts (Assembly segment breakdown of the Parliament election) were not collected.
* Aggregate results say nothing about individual voter behaviour.


## Author:  ANNAM NAGA VENKATA DEEPAK
## Role applied for:  Front End Developer
## Email: annamdeepak1912@gmail.com 
## GitHub: https://github.com/Deepu588
## Live demo: https://Deepu588.github.io/machilipatnam-elections-dashboard/