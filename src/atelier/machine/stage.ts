import {
  HalfFloatType,
  LinearMipmapLinearFilter,
  Mesh,
  OrthographicCamera,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  Raycaster,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three'
import { buildMachine } from './model'
import { createPaintMaterial } from './paintPass'

type Pose = { r: number; yaw: number; pitch: number; look: Vector3 }
const OFF: Pose = { r: 10.6, yaw: 0.46, pitch: 0.2, look: new Vector3(0.55, 1.55, 0.9) }
const ON: Pose = { r: 7.6, yaw: 0.15, pitch: 0.11, look: new Vector3(0.1, 1.75, 1.1) }

/** CSS matrix3d taking a w×h box onto the quad p0..p3 (clockwise from top-left). */
function quadMatrix(w: number, h: number, p: Vector2[]) {
  const [a0, a1, a2, a3] = p
  const sx = a0.x - a1.x + a2.x - a3.x,
    sy = a0.y - a1.y + a2.y - a3.y
  let g = 0,
    k = 0
  if (Math.abs(sx) > 1e-6 || Math.abs(sy) > 1e-6) {
    const dx1 = a1.x - a2.x,
      dx2 = a3.x - a2.x,
      dy1 = a1.y - a2.y,
      dy2 = a3.y - a2.y
    const den = dx1 * dy2 - dx2 * dy1
    g = (sx * dy2 - dx2 * sy) / den
    k = (dx1 * sy - sx * dy1) / den
  }
  const a = a1.x - a0.x + g * a1.x,
    b = a3.x - a0.x + k * a3.x,
    d = a1.y - a0.y + g * a1.y,
    e = a3.y - a0.y + k * a3.y
  return `matrix3d(${a / w},${d / w},0,${g / w},${b / h},${e / h},0,${k / h},0,0,1,0,${a0.x},${a0.y},0,1)`
}

export type Stage = ReturnType<typeof createStage>

export function createStage(canvas: HTMLCanvasElement, overlay: HTMLElement, quiet: boolean) {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false, premultipliedAlpha: true })
  renderer.setClearColor(0x000000, 0)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = PCFSoftShadowMap

  const model = buildMachine()
  const camera = new PerspectiveCamera(26, 1, 0.1, 60)
  const target = new WebGLRenderTarget(1, 1, {
    type: HalfFloatType,
    samples: 4,
    generateMipmaps: true,
    minFilter: LinearMipmapLinearFilter,
  })
  const paint = createPaintMaterial(target.texture)
  const post = new Scene()
  const quad = new Mesh(new PlaneGeometry(2, 2), paint)
  quad.frustumCulled = false
  post.add(quad)
  const postCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)

  const size = { w: 1, h: 1, screenW: 360 }
  const pointer = new Vector2()
  const aim = new Vector2()
  let power = 0,
    powerTarget = 0,
    visible = true,
    ready = false,
    disposed = false,
    raf = 0,
    last = 0

  const look = new Vector3()
  const pose = { r: OFF.r, yaw: OFF.yaw, pitch: OFF.pitch }
  look.copy(OFF.look)

  const placeCamera = (p: { r: number; yaw: number; pitch: number }, at: Vector3) => {
    camera.position.set(
      at.x + p.r * Math.sin(p.yaw) * Math.cos(p.pitch),
      at.y + p.r * Math.sin(p.pitch),
      at.z + p.r * Math.cos(p.yaw) * Math.cos(p.pitch),
    )
    camera.lookAt(at)
    camera.updateMatrixWorld()
  }
  const project = () =>
    model.corners.map((c) => {
      const v = c.clone().project(camera)
      return new Vector2(((v.x + 1) / 2) * size.w, ((1 - v.y) / 2) * size.h)
    })

  const frame = (now: number) => {
    raf = 0
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016)
    last = now
    const ease = quiet ? 1 : 1 - Math.exp(-dt * 3.2)
    const goal = powerTarget > 0.5 ? ON : OFF
    const sway = powerTarget > 0.5 ? 0.35 : 1
    aim.lerp(pointer, quiet ? 1 : 1 - Math.exp(-dt * 5))
    const want = {
      r: goal.r,
      yaw: goal.yaw + (quiet ? 0 : aim.x * 0.2 * sway),
      pitch: goal.pitch + (quiet ? 0 : -aim.y * 0.07 * sway),
    }
    pose.r += (want.r - pose.r) * ease
    pose.yaw += (want.yaw - pose.yaw) * ease
    pose.pitch += (want.pitch - pose.pitch) * ease
    look.lerp(goal.look, ease)
    power += (powerTarget - power) * (quiet ? 1 : 1 - Math.exp(-dt * 4))
    placeCamera(pose, look)

    model.glass.emissiveIntensity = power * 0.9
    model.screenLight.intensity = power * 2.4
    model.led.emissiveIntensity = 0.25 + power * 2.2

    renderer.setRenderTarget(target)
    renderer.render(model.scene, camera)
    renderer.setRenderTarget(null)
    renderer.render(post, postCamera)
    overlay.style.transform = quadMatrix(size.screenW, size.screenW * 0.75, project())

    const moving =
      Math.abs(want.r - pose.r) > 0.002 ||
      Math.abs(want.yaw - pose.yaw) > 0.0005 ||
      Math.abs(want.pitch - pose.pitch) > 0.0005 ||
      look.distanceTo(goal.look) > 0.002 ||
      Math.abs(powerTarget - power) > 0.002 ||
      aim.distanceTo(pointer) > 0.002
    if (moving) invalidate()
    else last = 0
  }
  const invalidate = (force = false) => {
    if (!raf && ready && (visible || force)) raf = requestAnimationFrame(frame)
  }

  // ANGLE translates these shaders on first draw, which can stall the GPU for
  // a second; compile in parallel up front and paint one frame while offscreen.
  renderer.setRenderTarget(target)
  const compiling = renderer.compileAsync(model.scene, camera)
  renderer.setRenderTarget(null)
  void Promise.all([compiling, renderer.compileAsync(post, postCamera)]).then(() => {
    if (disposed) return
    ready = true
    invalidate(true)
  })

  const raycaster = new Raycaster()
  const ndc = new Vector2()
  const hits = (x: number, y: number) => {
    ndc.set((x / size.w) * 2 - 1, -(y / size.h) * 2 + 1)
    raycaster.setFromCamera(ndc, camera)
    return raycaster.intersectObject(model.power, false).length > 0
  }

  return {
    resize(w: number, h: number) {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      size.w = w
      size.h = h
      renderer.setPixelRatio(dpr)
      renderer.setSize(w, h, false)
      target.setSize(Math.round(w * dpr), Math.round(h * dpr))
      paint.uniforms.uRes.value.set(w * dpr, h * dpr)
      paint.uniforms.uPx.value = dpr * Math.max(1, w / 760)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      placeCamera(ON, ON.look)
      const p = project()
      size.screenW = Math.max(200, Math.round(p[0].distanceTo(p[1])))
      overlay.style.width = `${size.screenW}px`
      overlay.style.height = `${size.screenW * 0.75}px`
      placeCamera(pose, look)
      invalidate()
    },
    setPowered(on: boolean) {
      powerTarget = on ? 1 : 0
      invalidate()
    },
    point(x: number, y: number) {
      pointer.set(x, y)
      invalidate()
    },
    hitsPower: hits,
    pressKey(name: string, down: boolean) {
      if (model.pressKey(name, down)) invalidate()
    },
    setVisible(v: boolean) {
      visible = v
      if (v) invalidate()
      else if (raf) {
        cancelAnimationFrame(raf)
        raf = 0
        last = 0
      }
    },
    dispose() {
      disposed = true
      if (raf) cancelAnimationFrame(raf)
      model.dispose()
      target.dispose()
      paint.dispose()
      quad.geometry.dispose()
      renderer.dispose()
    },
  }
}
