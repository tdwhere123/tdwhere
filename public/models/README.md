# Authored island models

These are the web exports of the accepted Blender coot and aerator studies. Geometry and brush images are original; no reference artwork is embedded or sampled. The `.blend` studies and generation/baking scripts are retained with the source study artifacts, not loaded by the website.

## Runtime contracts

- `aerator-painterly.glb`: identity-root, Y up, shaft along X, original lake units. The scene applies `AERATOR.size = 1.5`. `wheel_0`…`wheel_3` rotate incrementally about local X, preserving the authored initial phase. Four wheels share one mesh/atlas. `Lamp` / material `lamp_glow` is the mast light. Existing float perch points remain just above the decks.
- `coot-painterly.glb`: Y up, +X forward, approximately 0.25 lake units long; Y=0 is the waterline. `head_pivot` is animated additively from its exported rest transform. Each bird gets an independent skeleton; geometry, materials and textures are shared across the nine birds.
- `GLTFLoader` retains the authored color textures, UVs, alpha and skinning. The island lighting adapter changes only final lighting, using the existing sky/day/night/lamp/snow state. It does not replace the materials with flat colors. The bird does not accumulate snow.
- Spray, wave impulses, turning speed, machine click toggles, flock behavior, camera and page layout remain procedural in the original scene.

## Verification boundary

`asset-contracts.test.ts` reads the shipped GLB geometry and validates the machine pivots, lamp, decks and click bounds; pose tests cover the seven bird modes and bill-first diving. CPU parsing deliberately skips GPU image decoding. These tests do **not** prove browser rendering, material fidelity, alpha sorting or mobile frame rate.

Blender export/reimport previews verify the baked source appearance. Actual website WebGL screenshots and performance checks remain a separate required visual review; do not describe a Blender preview as the final website render.

## Export inventory

| Model | Bytes | Triangles per instance | Materials |
| --- | ---: | ---: | ---: |
| Aerator | 2,931,912 | 36,864 (14,508 unique across shared wheels) | 10 |
| Coot | 1,179,580 | 9,292 | 6 |

The coot's main brushwork is composited into one opaque 1024² atlas (two small ivory alpha layers remain), reducing the source study's 23,110 triangles and 14 materials per bird. Its soft two-bone neck rig avoids a rigid cut seam. The aerator's procedural brush colors are baked into UV atlases; five small original alpha-brush overlays remain. Source-stage Blender reimport comparisons were inspected; tiny raised brush shadows are flatter in the atlas version.

SHA-256:

```text
456366632d99272b06d7ed0611f994eded189db3d1a75311cbc8aed370e724c8  aerator-painterly.glb
8ace1423325da99d6de335253cfa20cfd09b252830cdab78c8dd45d9359a9ecc  coot-painterly.glb
```
