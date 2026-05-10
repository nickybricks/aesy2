# Aesy — Quantitative Stock Analyzer

Aesy is a web application for fundamental and quantitative stock analysis,
inspired by the investment principles of Warren Buffett and Peter Lynch.
It scores publicly listed companies on quality, growth, financial strength
and valuation, and lets users screen the global stock universe through a
rich filter interface.

- **Live app:** https://aesy2.lovable.app
- **Lovable project:** https://lovable.dev/projects/d949b9a9-b92f-497d-aeeb-d6d929d6984d

## Features

- **Buffett-style scoring** — proprietary "Aesy Score" (0–14) computed from
  profitability, growth, debt and valuation criteria.
- **Quant screener** (`/quant`) — filter thousands of stocks by Aesy Score,
  P/E, ROIC, ROE, dividend yield, EPS / revenue growth (3y / 5y / 10y),
  margins, leverage and more.
- **Hierarchical sector / industry filter** — multi-select tree grouped into
  Cyclical, Defensive and Sensitive super-sectors.
- **Detailed single-stock analysis** — DCF valuation, margin of safety,
  Peter Lynch chart, predictability stars, qualitative analysis, news.
- **Watchlists & portfolios** — save and track companies per user.
- **Internationalization** — German and English, auto-detected from the
  browser locale.
- **Admin dashboard** — cron job overview, cache management, scheduled
  data updates.
- **Mobile-first responsive UI** with light/dark themes.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite 5, Tailwind CSS, shadcn/ui,
  Radix UI, TanStack Query, React Router, Recharts, Framer Motion.
- **Backend (Lovable Cloud / Supabase):** Postgres with Row-Level Security,
  Supabase Auth, Edge Functions (Deno) for data ingestion, scoring and
  scheduled updates.
- **External data:** Financial Modeling Prep (FMP) API for fundamentals,
  prices and company profiles; OpenAI / Perplexity for qualitative
  analysis and news.

## Project Structure

```text
src/
  api/             FMP & cached quant analyzer client code
  components/      UI, metrics cards, screener, charts
  components/ui/   shadcn/ui primitives + custom filters
  context/         Auth, language, stock data, currency
  hooks/           React hooks (auth, watchlists, analytics, ...)
  i18n/            German + English translations
  pages/           Route-level pages (LandingPage, BuffettQuantAnalyzer, ...)
  services/        Domain services (DCF, valuation, scoring)
  utils/           Helpers (currency, country mapping, WACC, ...)
supabase/
  functions/       Edge functions (scoring, scheduled updates, news, ...)
  migrations/      SQL schema migrations
```

## Getting Started (local development)

Requires Node.js 20+ and npm (or bun).

```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm install
npm run dev
```

The app runs on http://localhost:8080. Backend (database + edge functions)
is provided by Lovable Cloud and requires no local setup — credentials are
already wired through `src/integrations/supabase/client.ts`.

### Available scripts

- `npm run dev` — start the Vite dev server.
- `npm run build` — production build.
- `npm run build:dev` — development-mode build.
- `npm run preview` — preview the production build.
- `npm run lint` — run ESLint.

## Editing the Code

- **Lovable** — open the [Lovable project](https://lovable.dev/projects/d949b9a9-b92f-497d-aeeb-d6d929d6984d)
  and prompt; changes are committed automatically.
- **Local IDE** — clone the repo, push commits; changes sync to Lovable.
- **GitHub web editor / Codespaces** — also fully supported.

## Deployment

Open the Lovable project and click **Share → Publish**. Custom domains can
be configured under **Project → Settings → Domains**.

## License

Proprietary. All rights reserved.