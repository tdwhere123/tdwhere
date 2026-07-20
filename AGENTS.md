# AGENTS.md

## Cursor Cloud specific instructions

This is a client-side single-page app: React 19 + TypeScript + Vite 7, styled with Tailwind CSS v3 and shadcn/ui components. It is a bilingual (zh/en) personal portfolio site. There is no backend, database, or API — everything runs in the browser.

### Services

Single frontend service only.

- Dev server: `npm run dev` (Vite, serves on port `3000`, configured in `vite.config.ts`).
- Build: `npm run build` (runs `tsc -b` then `vite build`).
- Lint: `npm run lint` (ESLint flat config).
- Preview built output: `npm run preview`.

### Notes

- `npm run lint` currently reports pre-existing errors (mostly `react-refresh/only-export-components` from shadcn/ui files, plus a couple of `react-hooks` rules). These are not environment issues; do not treat them as caused by your changes unless your diff introduces new ones.
- There are no automated tests in this repo.
- No environment variables or secrets are required to run the app.
