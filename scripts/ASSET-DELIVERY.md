# Painting, film and font delivery

`npm run dev` and `npm run build` run `filmAssets()` from `vite.config.ts`. No preparatory script or hand-maintained derivative manifest is needed. Drop new rolls into `src/assets/film/<roll>/` as before; Vite's glob discovery and file watching also cover the `?film-asset` imports.

- Each frame gets an **uncropped, auto-oriented 320w thumbnail** and **640w shelf preview**, WebP quality 78. Small originals are never enlarged. The viewer strip uses 320w; the shelf uses 640w (also covering typical high-DPI shelf sizes).
- `FilmFrame.src` remains the **original URL**, used by the full-size viewer and painter. IDs, URLs, captions and crop focus still come from the original file and `roll.json`. Canister images and ground paintings are not converted.
- Generated dimensions establish the viewer aspect ratio without an extra original decode. Strip crops apply the existing frame focus. Original-only assets remain valid inputs to `collect()`; `filmImage()` falls back to their original.
- Derivatives and their dimensions are cached in ignored `node_modules/.cache/film-assets/`. Keys include original **bytes**, transformation settings and encoder versions. Renaming a file reuses its cache; replacing its bytes regenerates it. Cache writes are atomic, with the manifest committed last. Delete this directory to reclaim old entries; it is safe to rebuild.
- Vite imports the generated files as normal URL assets: development serves them locally, production emits them under the configured `/tdwhere/` base. No derivative files belong in git. Cold generation is serialized to bound decoder memory; warm runs reuse cached output. Invalid originals fail generation rather than silently shipping oversized strip images.

The four external font stylesheets in `index.html` (Google: Zhi Mang Xing, Homemade Apple, DM Mono and Oswald for the canister labels; LXGW WenKai light, regular and bold, sliced by unicode range) use non-matching `media="print"` until their load handler enables them. They do not gate first paint; the opening waits for `document.fonts.ready` as one of its tasks. `<noscript>` restores normal stylesheets without JS. No remote CSS `@import` is added. A future strict CSP must permit/replace these inline load handlers. Font-provider latency and font swapping can still occur after first paint.

## Home painting and initialization

The hero definition lives in `src/atelier/grounds.ts`, so importing the shell does **not** pull in the roll catalog or its thumbnail URL table. `src/assets/ground/home.jpg` is frame 43 of `2023-11-05-zhujiajian` with the left edge cropped. `home-painted.webp` (1600 px) and `home-painted-2560.webp` are one authored, checked-in painting of it, made with `paintHome()`/`seaColor()` in `paint/painter.ts`; `home-relief.webp` (1280 px, grey) is the thickness of the same strokes. `homePainting()` in `grounds.ts` picks the 2560 px file only when the screen has the pixels for it. The home still/WebGL surface, the opening and the film page's backdrop all use this decoded source, not paintings generated on the visitor's main thread. Regenerate all three after changing the photo or the painting recipe:

```sh
npm run dev
# With an already running Chrome debugging endpoint (including Windows Chrome from WSL):
node scripts/bake-home.mjs http://localhost:3000/ http://127.0.0.1:9339
# Or omit the debugging URL and set CHROME_PATH to a local Chrome executable.
```

Builds require neither Chrome nor the authoring script. `paint/light.ts` maps the visitor's hour (`daylight.ts`) to pigment light. HomeFrame sends this through the retained `light` bus signal; the opening drives `reveal` and the home page drives `depth` the same way; pages still never import the engine.

`Art` checks intersection and retained suspension **before** source painting / graphics initialization. A prepared image is visible until the first live draw. Its canvas stays mounted as the observation target even in still/error mode; previous stills remain through responsive/motion changes. Projects mounts backgrounds only after they are requested. Initialization failure is reported and marked `failed`, retaining an existing still or showing a dependency-free colored ground rather than silently claiming an empty successful still. Reduced motion, unavailable WebGL and context loss continue to show the actual painting when the source is available.

## Checks

```sh
npx vitest run src/atelier/film.test.ts src/atelier/film-assets.test.ts
npm run build
# Against the production preview; CHROME_PATH is also supported.
CHROME_DEBUG_URL=http://127.0.0.1:9339 node scripts/e2e-smoke.mjs http://localhost:4173/tdwhere/
```

The original collection tests are retained. Asset tests exercise variant selection/fallback, canonical identity/focus, orientation, no-upscale, byte-based invalidation, cache reuse/repair, corrupt-image errors, production base/emission, dev HTTP image serving and new-roll discovery. `sharp` is the only added dev dependency; **no npm scripts were added or changed**. Vitest's normal image loader supplies original-only URLs for unrelated unit tests; the asset integration tests explicitly run the real plugin.
