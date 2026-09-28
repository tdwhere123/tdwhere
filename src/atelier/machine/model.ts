import {
  BoxGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  Group,
  HemisphereLight,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  PointLight,
  Scene,
  ShadowMaterial,
  Vector3,
  type BufferGeometry,
  type Material,
} from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

const rows = ['1234567890-=', 'qwertyuiop[]', "asdfghjkl;'", 'zxcvbnm,./']
const KEY = 0.2
const KEYBOARD_Z = 2.35
const KEY_TOP = 0.2

/** Glass extent in world units; the DOM screen is mapped onto these corners. */
const GLASS = { w: 1.64, h: 1.23, y: 1.95, z: 1.3 }

export type MachineModel = {
  scene: Scene
  power: Mesh
  glass: MeshStandardMaterial
  led: MeshStandardMaterial
  screenLight: PointLight
  corners: Vector3[]
  pressKey: (name: string, down: boolean) => boolean
  dispose: () => void
}

export function buildMachine(): MachineModel {
  const scene = new Scene()
  const geometries: BufferGeometry[] = []
  const materials: Material[] = []
  const geo = <T extends BufferGeometry>(g: T) => (geometries.push(g), g)
  const mat = (color: string, roughness = 0.72, extra: Partial<MeshStandardMaterial> = {}) => {
    const m = new MeshStandardMaterial({ color, roughness, metalness: 0, ...extra })
    materials.push(m)
    return m
  }
  const add = (
    parent: Group | Scene,
    g: BufferGeometry,
    m: Material,
    x: number,
    y: number,
    z: number,
  ) => {
    const mesh = new Mesh(g, m)
    mesh.position.set(x, y, z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    parent.add(mesh)
    return mesh
  }

  const plastic = mat('#e7decd')
  const plasticDeep = mat('#b9ad96', 0.8)
  const bezel = mat('#cdc2aa', 0.65)
  const slot = mat('#39332a', 0.9)
  const seal = mat('#9b4d32', 0.6)
  const keyCap = mat('#efe8da', 0.6)
  const glass = mat('#16211f', 0.22, { emissive: new Color('#39513f'), emissiveIntensity: 0 })
  const led = mat('#5e3a2c', 0.4, { emissive: new Color('#d9a45a'), emissiveIntensity: 0 })

  const machine = new Group()
  scene.add(machine)

  add(machine, geo(new RoundedBoxGeometry(2.4, 2.86, 2.5, 5, 0.16)), plastic, 0, 1.57, 0)
  add(machine, geo(new RoundedBoxGeometry(2.0, 0.16, 2.1, 3, 0.05)), plasticDeep, 0, 0.08, -0.05)
  add(machine, geo(new BoxGeometry(2.41, 0.018, 2.51)), plasticDeep, 0, 0.62, 0)

  add(machine, geo(new RoundedBoxGeometry(1.92, 1.52, 0.1, 3, 0.05)), bezel, 0, GLASS.y, 1.25)
  const glassGeo = geo(new PlaneGeometry(GLASS.w, GLASS.h, 18, 14))
  const pos = glassGeo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i) / (GLASS.w / 2),
      v = pos.getY(i) / (GLASS.h / 2)
    pos.setZ(i, 0.035 * (1 - u * u) * (1 - v * v))
  }
  glassGeo.computeVertexNormals()
  add(machine, glassGeo, glass, 0, GLASS.y, GLASS.z)

  add(machine, geo(new RoundedBoxGeometry(0.86, 0.17, 0.03, 2, 0.012)), plasticDeep, 0.45, 0.86, 1.25)
  add(machine, geo(new BoxGeometry(0.7, 0.045, 0.03)), slot, 0.45, 0.86, 1.262)
  add(machine, geo(new RoundedBoxGeometry(0.16, 0.16, 0.03, 2, 0.02)), seal, -0.85, 0.86, 1.25)
  for (let i = 0; i < 7; i++)
    add(machine, geo(new BoxGeometry(0.02, 0.9, 0.05)), plasticDeep, 1.2, 1.9, -0.75 + i * 0.13)

  const power = add(
    machine,
    geo(new CylinderGeometry(0.075, 0.075, 0.05, 24)),
    mat('#bca16c', 0.5),
    0.95,
    0.44,
    1.26,
  )
  power.rotation.x = Math.PI / 2
  add(machine, geo(new CylinderGeometry(0.022, 0.022, 0.03, 12)), led, 0.74, 0.44, 1.26).rotation.x =
    Math.PI / 2

  const keyboard = new Group()
  keyboard.position.set(0, 0, KEYBOARD_Z)
  keyboard.rotation.x = 0.05
  scene.add(keyboard)
  add(keyboard, geo(new RoundedBoxGeometry(2.7, 0.14, 1.02, 3, 0.05)), plastic, 0, 0.08, 0)

  const layout: { name: string; x: number; z: number; w: number }[] = []
  rows.forEach((row, r) => {
    const z = -0.36 + r * KEY
    const start = -((row.length - 1) * KEY) / 2 + r * 0.04
    ;[...row].forEach((ch, i) => layout.push({ name: ch, x: start + i * KEY, z, w: 1 }))
  })
  layout.push(
    { name: 'back', x: -0.86, z: 0.44, w: 1.7 },
    { name: 'space', x: 0, z: 0.44, w: 6 },
    { name: 'enter', x: 0.86, z: 0.44, w: 1.7 },
  )
  const keys = new InstancedMesh(geo(new RoundedBoxGeometry(0.17, 0.08, 0.17, 2, 0.03)), keyCap, layout.length)
  keys.castShadow = true
  keys.receiveShadow = true
  const m4 = new Matrix4()
  const place = (i: number, depth: number) => {
    const k = layout[i]
    m4.makeScale(k.w === 1 ? 1 : (k.w * KEY - 0.03) / 0.17, 1, 1)
    m4.setPosition(k.x, KEY_TOP - depth, k.z)
    keys.setMatrixAt(i, m4)
  }
  layout.forEach((_, i) => place(i, 0))
  keyboard.add(keys)

  add(scene, geo(new RoundedBoxGeometry(0.32, 0.11, 0.5, 3, 0.05)), plastic, 1.85, 0.055, 2.4).rotation.y = -0.2

  const ground = new Mesh(geo(new PlaneGeometry(14, 14)), new ShadowMaterial({ color: '#34496e', opacity: 0.26 }))
  materials.push(ground.material)
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)

  scene.add(new HemisphereLight('#f6f1e8', '#56709a', 1.8))
  const key = new DirectionalLight('#fff0dc', 2.4)
  key.position.set(-4.5, 7, 5)
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  key.shadow.camera.left = -4
  key.shadow.camera.right = 4
  key.shadow.camera.top = 4
  key.shadow.camera.bottom = -4
  key.shadow.bias = -0.0005
  key.shadow.normalBias = 0.02
  scene.add(key)
  const fill = new DirectionalLight('#9db4d6', 0.9)
  fill.position.set(5, 2.5, 3)
  scene.add(fill)
  const screenLight = new PointLight('#e0bd7e', 0, 4.5, 1.6)
  screenLight.position.set(0, GLASS.y, 1.9)
  scene.add(screenLight)

  const inset = 0.015
  const hw = GLASS.w / 2 - inset,
    hh = GLASS.h / 2 - inset
  const corners = [
    new Vector3(-hw, GLASS.y + hh, GLASS.z),
    new Vector3(hw, GLASS.y + hh, GLASS.z),
    new Vector3(hw, GLASS.y - hh, GLASS.z),
    new Vector3(-hw, GLASS.y - hh, GLASS.z),
  ]

  return {
    scene,
    power,
    glass,
    led,
    screenLight,
    corners,
    pressKey(name, down) {
      const i = layout.findIndex((k) => k.name === name)
      if (i < 0) return false
      place(i, down ? 0.045 : 0)
      keys.instanceMatrix.needsUpdate = true
      return true
    },
    dispose() {
      geometries.forEach((g) => g.dispose())
      materials.forEach((m) => m.dispose())
      keys.dispose()
    },
  }
}
