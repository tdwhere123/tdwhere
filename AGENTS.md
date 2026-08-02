# AGENTS.md

## Cursor Cloud specific instructions

This is a client-side single-page app: React 19 + TypeScript + Vite 7, styled with Tailwind CSS v3 and a small shadcn/ui surface (`accordion` only). It is a bilingual (zh/en) personal portfolio site. There is no backend, database, or API — everything runs in the browser.

### Services

Single frontend service only.

- Dev server: `npm run dev` (Vite, serves on port `3000`, configured in `vite.config.ts`).
- Build: `npm run build` (runs `tsc -b` then `vite build`).
- Lint: `npm run lint` (ESLint flat config; currently passes).
- Unit tests: `npm run test` (Vitest).
- Preview built output: `npm run preview`.

### Notes

- Puppeteer scripts under `scripts/` (e.g. `scripts/e2e-smoke.mjs`) are manual smoke checks; they are not wired into CI unless explicitly added. Run against a local preview/dev server with Chrome available.
- No environment variables or secrets are required to run the app.
- Palette colors in `tailwind.config.js` are mapped through `--*-rgb` channel variables (declared in `src/index.css`) so Tailwind `/opacity` modifiers compose — always add the channel variable when adding a color, never reference a bare `var(--color)` in the Tailwind palette.
- Corner-radius system: buttons/chips are `rounded-full`, cards and panels `rounded-xl`–`rounded-[28px]`, small controls `rounded-md`; `--radius` in `src/index.css` is the base scale. Keep sharp corners only where they are an intentional motif (stamps, gallery plate brackets).
- Icons come from `lucide-react` only; no emoji in UI surfaces.
