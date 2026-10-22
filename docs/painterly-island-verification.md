# Painterly island integration verification

Scope: replace only coot/aerator visuals with the accepted authored Blender models. Keep the original island, camera, time/weather, interaction, spray/wakes and page layout. No reference-site assets or layout are imported.

## Automated checks

Run from the repository root:

```sh
npm ci
npm run lint
npm test
npm run build
npm run preview
node scripts/e2e-smoke.mjs http://localhost:4173/tdwhere/
```

The new tests cover shared resource disposal, preserving glTF shader map/alpha/skinning stages, additive independent head motion, all seven bird pose modes, bill-first dive direction, invalid asset rejection before WebGL allocation, and the actual exported aerator's pivot/light/perch/click contracts.

## Required visual review

Use a browser with WebGL2 enabled and a fresh session (or replay via the home weather line):

1. Daylight: approved coot silhouette, small eyes and charcoal directional brush marks; cream pontoons, muted green perforated paddles, blue brushed motor. Check the page-scale view and entry zoom.
2. Click the machine repeatedly: wheels stop/restart, spray eases out/in; touch water and coots to check wake/startle/dive. Stopped-machine perching and hop/leave contact must stay on the pontoon decks.
3. Dusk/night: lamp warms nearby surfaces and glitters on water; birds and machine must not stay self-lit at daylight brightness.
4. Rain/snow: existing precipitation/water response, snow on upward machine surfaces but not the coots.
5. Enter, Escape, replay, repeated mounts, tab hide/show and mobile portrait. Check no console/WebGL errors, missing model requests, transparency halos or growing GPU resource use.
6. Capture actual desktop/mobile screenshots and frame timings. Blender round-trip images alone are not final website QA.

## Current execution limit

The cloud test environment prevented Chromium from launching. Browser rendering, GLSL compilation, interactions and performance are therefore unverified. This is not a reported WebGL failure in the application itself.
