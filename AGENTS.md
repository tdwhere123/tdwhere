# AGENTS.md

## Cursor Cloud specific instructions

This is a client-side single-page app: React 19 + TypeScript + Vite 7, styled with Tailwind CSS v3. The live app lives in `src/atelier` (mounted from `src/main.tsx`). It is a bilingual (zh/en) personal portfolio site. There is no backend, database, or API — everything runs in the browser.

### Services

Single frontend service only.

- Dev server: `npm run dev` (Vite, serves on port `3000`, configured in `vite.config.ts`).
- Build: `npm run build` (runs `tsc -b` then `vite build`).
- Lint: `npm run lint` (ESLint flat config; currently passes).
- Unit tests: `npm run test` (Vitest).
- Preview built output: `npm run preview`.

### Notes

- Puppeteer smoke: `node scripts/e2e-smoke.mjs [baseUrl]` (default `http://localhost:4173/tdwhere/`). Needs Chrome (`CHROME_PATH` or a common system binary). Not wired into CI.
- No environment variables or secrets are required to run the app.
- Painted fields: `Art` (`src/atelier/components/Primitives.tsx`) paints each field procedurally (`src/atelier/paint/painter.ts`, no image assets) and renders it live through the WebGL2 engine (`paint/engine.ts`, `paint/shaders.ts`, per-art presets in `paint/presets.ts`). Without WebGL2 or with reduced motion it shows the same painting as a still image. Scenes talk to a mounted painting only through `paint/bus.ts` channels (`home`, `memory`, `process`, …) in client coordinates; never import the engine directly. The pointer's wet wash is `components/WetTrail.tsx` (mouse only, no custom cursor shape).
- Home is pinned: one sticky stage holds the `pond` painting (a series of layers: rain, night, dawn, day, dusk) and every chapter, stacked in place. Empty `.a-snap` blocks make the scroll track (mandatory snapping, one chapter per gesture); scroll progress crossfades the chapters and sends `scene` signals that lay the next layer down stroke by stroke (`drag` signals smear the paint). Chapter layers are listed in `scenes` in `pages/Home.tsx`. Pinned chapters cannot scroll on their own, so keep each one within a short viewport. Later layers are painted lazily, so keep new layers cheap. The first visit of a session that lands on `/` shows the overture (`shell/Overture.tsx`, `paint/overture.ts`): rain on painted water around a small glass sphere, waiting until a touch, key or scroll lets it in; Escape skips. It is off on reduced motion and without WebGL2.
- Palette colors in `tailwind.config.js` are mapped through `--*-rgb` channel variables (declared in `src/index.css`) so Tailwind `/opacity` modifiers compose — always add the channel variable when adding a color, never reference a bare `var(--color)` in the Tailwind palette.
- Corner-radius system: buttons/chips are `rounded-full`, cards and panels `rounded-xl`–`rounded-[28px]`, small controls `rounded-md`; `--radius` in `src/index.css` is the base scale. Keep sharp corners only where they are an intentional motif (stamps, gallery plate brackets).
- Icons come from `lucide-react` only; no emoji in UI surfaces.
