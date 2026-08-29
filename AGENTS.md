# FinancePro Agent Guide

## Project Shape

- This is a React 19 + TypeScript + Vite frontend. The main entrypoints are [index.tsx](index.tsx), [App.tsx](App.tsx), and [vite.config.ts](vite.config.ts).
- `App.tsx` owns `AppState`, local persistence, authentication flow, user filtering, CRUD operations, and credit-invoice synchronization. Keep domain mutations there unless a change clearly belongs in a utility.
- `components/` contains prop-driven feature views. `types.ts` is the source of truth for domain entities; `constants.tsx` contains seeded data.
- `utils/financialEngine.ts` handles recurring and installment expansion. `utils/auth.ts` handles browser-side SHA-256 password hashing.
- `main.py` is a separate FastAPI static-file server, not an application API. It serves files from the current directory on port 8000.

## Development

- Install dependencies with `npm install`.
- Run the frontend with `npm run dev` (Vite listens on port 3000 and binds to `0.0.0.0`).
- Validate production output with `npm run build`; inspect it with `npm run preview`.
- There are currently no test or lint scripts. Do not claim test coverage without adding and running an appropriate check.
- Python dependencies are listed in [requirements.txt](requirements.txt). `python main.py` starts the static server on port 8000, but the Vite production output/deployment path is not fully wired. See [README.md](README.md) for the current user-facing setup notes.

## Implementation Rules

- Use functional React components with explicit props interfaces and existing libraries such as Lucide and Recharts. Follow the existing Tailwind utility-class styling approach.
- Preserve dates as ISO `YYYY-MM-DD` strings. Be cautious with `new Date()` because timezone conversion can shift date-only values; follow nearby date/month handling before changing it.
- Use functional state updates (`setState(prev => ...)`) for state that combines transactions, recurring items, accounts, and invoices.
- Credit-card transactions and recurring items create related `creditInvoices` entries. Any edit, deletion, installment change, or payment change must keep source records and invoice items consistent.
- Data is local-only in `localStorage` under `finance_pro_state`; there is no database, server authentication, API client, or synchronization layer. Treat client-side auth and admin filtering as application behavior, not production security.
- Preserve existing ID and data-shape conventions unless the change includes a deliberate migration. Existing IDs are generated in the browser and are not backend identifiers.
- Check all date/month calculations across `App.tsx`, the relevant view, `ReportsView.tsx`, `Dashboard.tsx`, and `utils/financialEngine.ts` when changing financial period behavior.

## Scope Discipline

- Keep changes close to the owning component or utility and avoid unrelated formatting or dependency changes.
- Reuse domain types and existing UI patterns before introducing new abstractions.
- After edits, run the narrowest relevant check; for frontend changes, at minimum run `npm run build` when no focused test exists.
