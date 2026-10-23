import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

export type IslandModels = { coot: THREE.Group; aerator: THREE.Group }

export function disposeModelResources(...roots: THREE.Object3D[]) {
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>(), skeletons = new Set<THREE.Skeleton>()
  for (const root of roots) root.traverse(object => {
    if (!(object instanceof THREE.Mesh || object instanceof THREE.Points)) return
    geometries.add(object.geometry)
    if (object instanceof THREE.SkinnedMesh) skeletons.add(object.skeleton)
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material)
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value)
    }
  })
  const bitmaps = new Set<ImageBitmap>()
  textures.forEach(texture => {
    texture.dispose()
    if (typeof ImageBitmap !== 'undefined' && texture.source.data instanceof ImageBitmap) bitmaps.add(texture.source.data)
  })
  bitmaps.forEach(bitmap => bitmap.close())
  skeletons.forEach(skeleton => skeleton.dispose())
  materials.forEach(material => material.dispose())
  geometries.forEach(geometry => geometry.dispose())
}

export async function loadIslandModels(): Promise<IslandModels> {
  const loader = new GLTFLoader()
  const results = await Promise.allSettled([
    loader.loadAsync(`${import.meta.env.BASE_URL}models/coot-painterly.glb`),
    loader.loadAsync(`${import.meta.env.BASE_URL}models/aerator-painterly.glb`),
  ])
  const failed = results.find(result => result.status === 'rejected')
  if (failed?.status === 'rejected') {
    results.forEach(result => { if (result.status === 'fulfilled') disposeModelResources(result.value.scene) })
    throw failed.reason
  }
  const [coot, aerator] = results
  if (coot.status !== 'fulfilled' || aerator.status !== 'fulfilled') throw new Error('Island models unavailable')
  return { coot: coot.value.scene, aerator: aerator.value.scene }
}

type LightUniforms = {
  sun: { value: THREE.Vector3 }; shade: { value: THREE.Vector3 }; lit: { value: THREE.Vector3 }
  day: { value: number }; night: { value: number }; lampAt: { value: THREE.Vector3 }; snowCover: { value: number }
}

// @anchor:authored-model-lighting Keep glTF's map, alpha and skinning pipeline; only the island's lighting replaces PBR output.
export function lightIslandModel(root: THREE.Object3D, shared: LightUniforms, bare: boolean) {
  const materials = new Set<THREE.MeshStandardMaterial>()
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (!(material instanceof THREE.MeshStandardMaterial)) throw new Error(`Unsupported island material: ${material.name}`)
      materials.add(material)
    }
  })
  materials.forEach(material => {
    const lamp = material.name === 'lamp_glow'
    material.onBeforeCompile = shader => {
      Object.assign(shader.uniforms, shared)
      shader.vertexShader = `varying vec3 vPaintWorld;\nvarying vec3 vPaintLocal;\n${shader.vertexShader}`
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvPaintLocal = position;')
        .replace('#include <project_vertex>', '#include <project_vertex>\nvPaintWorld = (modelMatrix * vec4(transformed, 1.)).xyz;')
      shader.fragmentShader = `
        uniform vec3 sun, shade, lit, lampAt;
        uniform float day, night, snowCover;
        varying vec3 vPaintWorld;
        varying vec3 vPaintLocal;
        float paintHash3(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
        float paintNoise3(vec3 p) {
          vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
          return mix(mix(mix(paintHash3(i), paintHash3(i + vec3(1,0,0)), f.x), mix(paintHash3(i + vec3(0,1,0)), paintHash3(i + vec3(1,1,0)), f.x), f.y),
            mix(mix(paintHash3(i + vec3(0,0,1)), paintHash3(i + vec3(1,0,1)), f.x), mix(paintHash3(i + vec3(0,1,1)), paintHash3(i + vec3(1,1,1)), f.x), f.y), f.z);
        }
        vec3 paintLinear(vec3 c) { return mix(c/12.92,pow((max(c,vec3(0.))+.055)/1.055,vec3(2.4)),step(vec3(.04045),c)); }
        float paintNoise(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      ${shader.fragmentShader}`.replace('#include <color_fragment>', `#include <color_fragment>
        float paintValue = dot(diffuseColor.rgb, vec3(.3, .59, .11));
        // broken color on the model's own surface, so it moves with the model: touches a shade
        // lighter or darker, a few leaning violet or teal, as on the water around it
        vec3 paintAt = vPaintLocal * ${bare ? '95.' : '24.'};
        float paintTouch = paintNoise3(paintAt * vec3(1., 2.4, 1.)), paintLean = paintNoise3(paintAt * .45 + 7.3);
        diffuseColor.rgb *= 1. + (paintTouch - .5) * .3;
        diffuseColor.rgb += (smoothstep(.62, .85, paintLean) * vec3(.03, -.015, .045) + smoothstep(.38, .15, paintLean) * vec3(-.035, .02, .012)) * (.4 + paintValue);
        ${bare ? '// charcoal laid with violet and umber, never a flat black\n        diffuseColor.rgb = mix(diffuseColor.rgb, paintValue * vec3(1.15, .92, 1.35) + vec3(.025, .018, .04), (1. - smoothstep(.2, .45, paintValue)) * .8);' : ''}
      `).replace('#include <opaque_fragment>', `
        vec3 paintN = inverseTransformDirection(normal, viewMatrix);
        vec3 paintL = paintLinear(lit) * (.2 + .8 * day);
        vec3 paintAmbient = mix(paintLinear(shade) * 1.4, paintLinear(lit), .5 + .5 * paintN.y);
        // light laid in two or three values, as a painter blocks it in, not a smooth CG falloff
        float paintRaw = max(dot(paintN, sun), 0.);
        float paintD = smoothstep(.04, .2, paintRaw) * .55 + smoothstep(.42, .62, paintRaw) * .45;
        outgoingLight = diffuseColor.rgb * (paintAmbient * (.18 + .32 * day) + paintD * paintL * .85);
        ${bare || lamp ? '' : `float settled = snowCover * smoothstep(.45,.85,paintN.y) * smoothstep(.3,.6,paintNoise(floor(vPaintWorld.xz * 60.)));
        outgoingLight = mix(outgoingLight,vec3(.93,.95,1.)*(paintAmbient*(.3+.4*day)+paintL*paintD*.6),settled);`}
        vec3 toPaintLamp = lampAt - vPaintWorld;
        outgoingLight += diffuseColor.rgb * vec3(1.,.72,.38) * night * 2.4 * max(dot(paintN,normalize(toPaintLamp)),.15)/(1.+dot(toPaintLamp,toPaintLamp)*22.);
        // the turning edge darkens a little, like a contour drawn with the same brush
        float paintEdge = 1. - abs(normal.z);
        outgoingLight *= 1. - smoothstep(.6, .95, paintEdge) * .3;
        // seen against the light, as in the photograph: the sun catches the rims it lies behind
        outgoingLight += paintL * diffuseColor.rgb * pow(paintEdge, 2.5) * smoothstep(-.2, .5, dot(paintN, sun)) * .55 * day;
        // the same air as the water and paper: a little of the sky's shade over everything
        outgoingLight = mix(outgoingLight, paintLinear(shade) * (.3 + .35 * day), .12);
        ${lamp ? 'outgoingLight = diffuseColor.rgb * (.2 + 7. * night);' : ''}
        #include <opaque_fragment>
      `)
    }
    material.customProgramCacheKey = () => `island-paint-v3-${bare}-${lamp}`
    material.needsUpdate = true
  })
}
