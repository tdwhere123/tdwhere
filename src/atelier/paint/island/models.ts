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
      shader.vertexShader = `varying vec3 vPaintWorld;\n${shader.vertexShader}`.replace('#include <project_vertex>', '#include <project_vertex>\nvPaintWorld = (modelMatrix * vec4(transformed, 1.)).xyz;')
      shader.fragmentShader = `
        uniform vec3 sun, shade, lit, lampAt;
        uniform float day, night, snowCover;
        varying vec3 vPaintWorld;
        vec3 paintLinear(vec3 c) { return mix(c/12.92,pow((max(c,vec3(0.))+.055)/1.055,vec3(2.4)),step(vec3(.04045),c)); }
        float paintNoise(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      ${shader.fragmentShader}`.replace('#include <opaque_fragment>', `
        vec3 paintN = inverseTransformDirection(normal, viewMatrix);
        vec3 paintL = paintLinear(lit) * (.2 + .8 * day);
        vec3 paintAmbient = mix(paintLinear(shade) * 1.4, paintLinear(lit), .5 + .5 * paintN.y);
        float paintD = max(dot(paintN, sun), 0.);
        outgoingLight = diffuseColor.rgb * (paintAmbient * (.18 + .32 * day) + paintD * paintL * .85);
        ${bare || lamp ? '' : `float settled = snowCover * smoothstep(.45,.85,paintN.y) * smoothstep(.3,.6,paintNoise(floor(vPaintWorld.xz * 60.)));
        outgoingLight = mix(outgoingLight,vec3(.93,.95,1.)*(paintAmbient*(.3+.4*day)+paintL*paintD*.6),settled);`}
        vec3 toPaintLamp = lampAt - vPaintWorld;
        outgoingLight += diffuseColor.rgb * vec3(1.,.72,.38) * night * 2.4 * max(dot(paintN,normalize(toPaintLamp)),.15)/(1.+dot(toPaintLamp,toPaintLamp)*22.);
        ${lamp ? 'outgoingLight = diffuseColor.rgb * (.2 + 7. * night);' : ''}
        #include <opaque_fragment>
      `)
    }
    material.customProgramCacheKey = () => `island-paint-v1-${bare}-${lamp}`
    material.needsUpdate = true
  })
}
