import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { CubeFacePosition, CubeStageId } from '../cube-data'
import { CUBE_SIZE, useRollingCube, WORLD_ROLL_DIR } from './useRollingCube'
import { asset } from '@/lib/asset'

const MATERIAL_FACES: CubeFacePosition[] = [
  'right',
  'left',
  'top',
  'bottom',
  'front',
  'back',
]

const FACE_URLS = MATERIAL_FACES.map((face) => asset(`cube/faces/${face}.png`))

/** Near-top view (~80°): cube reads upright on the plane. */
const INITIAL_CAM = new THREE.Vector3(0, 9.2, 1.65)

/** Floor S-mark: world +Z from cube centre (matches KeyS / ↓). */
const FLOOR_S_DIR = WORLD_ROLL_DIR.pz
/** Keep the mark close to the cube so it doesn't crowd footer / ink text. */
const FLOOR_ARROW_DIST = CUBE_SIZE * 0.68
const FLOOR_ARROW_SIZE: [number, number] = [0.28, 0.4]

export type CubeScreenRect = {
  /** Viewport fractions 0–1. */
  left: number
  right: number
  top: number
  bottom: number
  cx: number
  cy: number
  width: number
  height: number
}

export type CubeScreenAnchor = {
  /** Measured cube silhouette in the viewport (drives ink layout). */
  cube: CubeScreenRect
  /**
   * Convenience park point just outside the free side of `cube`
   * (normalized 0–1). Kept for caption / legacy callers.
   */
  x: number
  y: number
  preferRight: boolean
  /** Tip of the S-roll hint in screen space (normalized 0–1). */
  rollHintX: number
  rollHintY: number
  /** @deprecated kept for API compat */
  rollAngleDeg: number
}

const CORNER_SIGNS: ReadonlyArray<readonly [number, number, number]> = [
  [-1, -1, -1],
  [-1, -1, 1],
  [-1, 1, -1],
  [-1, 1, 1],
  [1, -1, -1],
  [1, -1, 1],
  [1, 1, -1],
  [1, 1, 1],
]

export function emptyCubeAnchor(): CubeScreenAnchor {
  return {
    cube: {
      left: 0.28,
      right: 0.72,
      top: 0.22,
      bottom: 0.72,
      cx: 0.5,
      cy: 0.47,
      width: 0.44,
      height: 0.5,
    },
    x: 0.78,
    y: 0.4,
    preferRight: true,
    rollHintX: 0.5,
    rollHintY: 0.78,
    rollAngleDeg: 0,
  }
}

function CubeMesh({ textures }: { textures: THREE.Texture[] }) {
  const materials = useMemo(
    () =>
      textures.map((map) => {
        map.colorSpace = THREE.SRGBColorSpace
        map.anisotropy = 4
        map.needsUpdate = true
        return new THREE.MeshBasicMaterial({ map, toneMapped: false })
      }),
    [textures],
  )

  useEffect(() => {
    return () => {
      materials.forEach((m) => {
        m.map = null
        m.dispose()
      })
    }
  }, [materials])

  return (
    <mesh material={materials}>
      <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
    </mesh>
  )
}

function FollowControls({
  targetRef,
  controlsRef,
  busyRef,
}: {
  targetRef: React.RefObject<THREE.Group | null>
  controlsRef: React.RefObject<OrbitControlsImpl | null>
  busyRef: React.RefObject<boolean>
}) {
  const desired = useRef(new THREE.Vector3())
  const orbiting = useRef(false)

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return
    const onStart = () => {
      orbiting.current = true
    }
    const onEnd = () => {
      orbiting.current = false
    }
    controls.addEventListener('start', onStart)
    controls.addEventListener('end', onEnd)
    return () => {
      controls.removeEventListener('start', onStart)
      controls.removeEventListener('end', onEnd)
    }
  }, [controlsRef])

  useFrame((_, dt) => {
    const g = targetRef.current
    const controls = controlsRef.current
    if (!g || !controls) return
    // Don't fight the user mid-drag; only chase the cube while rolling / idle.
    if (orbiting.current && !busyRef.current) return
    // World position — during a roll the cube is parented under a pivot.
    g.getWorldPosition(desired.current)
    desired.current.y = CUBE_SIZE * 0.2
    const speed = busyRef.current ? 5.5 : 1.4
    controls.target.lerp(desired.current, Math.min(1, dt * speed))
  })

  return null
}

declare global {
  interface Window {
    /** Live floor S-arrow tip for E2E (world-fixed direction, follows cube XZ). */
    __tdwhereRollArrow?: {
      wx: number
      wy: number
      wz: number
      sx: number
      sy: number
      /** World direction the mark points (unit XZ). */
      dirX: number
      dirZ: number
    }
    /** Programmatic orbit for E2E — azimuth/polar around the cube (radians). */
    __tdwhereSetOrbit?: (azimuthRad: number, polarRad?: number) => void
  }
}

/**
 * Hand-ink S-roll mark painted on the museum floor.
 * World-fixed: always points +Z (KeyS / ↓). Camera orbit does not rotate it —
 * only the cube’s XZ position is followed so the mark stays beside the cube.
 */
function FloorRollArrow({ targetRef }: { targetRef: React.RefObject<THREE.Group | null> }) {
  const groupRef = useRef<THREE.Group>(null)
  const { camera, size } = useThree()
  const center = useRef(new THREE.Vector3())
  const tipWorld = useRef(new THREE.Vector3())
  const ndc = useRef(new THREE.Vector3())

  const texture = useMemo(() => {
    const w = 256
    const h = 320
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, w, h)

    const ink = (a: number) => `rgba(44, 40, 34, ${a})`
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Shaft — two slightly offset strokes for ink wobble
    ctx.strokeStyle = ink(0.55)
    ctx.lineWidth = 3.2
    ctx.beginPath()
    ctx.moveTo(124, 36)
    ctx.bezierCurveTo(118, 90, 132, 140, 126, 200)
    ctx.bezierCurveTo(124, 230, 128, 250, 125, 268)
    ctx.stroke()

    ctx.strokeStyle = ink(0.4)
    ctx.lineWidth = 1.8
    ctx.beginPath()
    ctx.moveTo(132, 40)
    ctx.bezierCurveTo(136, 95, 122, 145, 130, 205)
    ctx.bezierCurveTo(132, 235, 126, 252, 129, 270)
    ctx.stroke()

    // Arrow head — uneven triangular blot
    ctx.fillStyle = ink(0.62)
    ctx.beginPath()
    ctx.moveTo(128, 292)
    ctx.lineTo(78, 232)
    ctx.quadraticCurveTo(104, 248, 128, 268)
    ctx.quadraticCurveTo(152, 246, 178, 228)
    ctx.closePath()
    ctx.fill()

    ctx.strokeStyle = ink(0.35)
    ctx.lineWidth = 1.4
    ctx.beginPath()
    ctx.moveTo(86, 238)
    ctx.quadraticCurveTo(108, 252, 128, 274)
    ctx.moveTo(170, 236)
    ctx.quadraticCurveTo(148, 250, 128, 274)
    ctx.stroke()

    // Floor tick under tip
    ctx.fillStyle = ink(0.28)
    ctx.beginPath()
    ctx.arc(128, 304, 4, 0, Math.PI * 2)
    ctx.fill()

    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 4
    tex.needsUpdate = true
    return tex
  }, [])

  useEffect(() => () => texture.dispose(), [texture])

  useFrame(() => {
    const cube = targetRef.current
    const g = groupRef.current
    if (!cube || !g) return

    cube.getWorldPosition(center.current)

    g.position.set(
      center.current.x + FLOOR_S_DIR.x * FLOOR_ARROW_DIST,
      0.03,
      center.current.z + FLOOR_S_DIR.z * FLOOR_ARROW_DIST,
    )
    // Plane on XZ. After Rx(-π/2), canvas +V maps to world −Z.
    // Ry(π) flips so the ink tip (+V) aims world +Z (away from cube).
    g.rotation.set(-Math.PI / 2, Math.PI, 0)

    tipWorld.current.set(
      g.position.x + FLOOR_S_DIR.x * FLOOR_ARROW_SIZE[1] * 0.42,
      0.04,
      g.position.z + FLOOR_S_DIR.z * FLOOR_ARROW_SIZE[1] * 0.42,
    )
    ndc.current.copy(tipWorld.current).project(camera)
    window.__tdwhereRollArrow = {
      wx: tipWorld.current.x,
      wy: tipWorld.current.y,
      wz: tipWorld.current.z,
      sx: ((ndc.current.x + 1) / 2) * size.width,
      sy: ((1 - ndc.current.y) / 2) * size.height,
      dirX: FLOOR_S_DIR.x,
      dirZ: FLOOR_S_DIR.z,
    }
  })

  return (
    <group ref={groupRef} userData={{ rollHint: 's-floor' }}>
      <mesh renderOrder={5}>
        <planeGeometry args={FLOOR_ARROW_SIZE} />
        <meshBasicMaterial
          map={texture}
          transparent
          depthWrite={false}
          depthTest={false}
          opacity={0.78}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}

function ScreenAnchorReporter({
  targetRef,
  onAnchor,
}: {
  targetRef: React.RefObject<THREE.Group | null>
  onAnchor?: (a: CubeScreenAnchor) => void
}) {
  const { camera } = useThree()
  const center = useRef(new THREE.Vector3())
  const tip = useRef(new THREE.Vector3())
  const corner = useRef(new THREE.Vector3())
  const ndc = useRef(new THREE.Vector3())
  const last = useRef({
    left: -1,
    right: -1,
    top: -1,
    bottom: -1,
    hx: -1,
    hy: -1,
  })

  useFrame(() => {
    if (!onAnchor || !targetRef.current) return

    const cubeObj = targetRef.current
    cubeObj.getWorldPosition(center.current)
    // Include a little padding for brass trim beyond the mesh half-extent
    const half = CUBE_SIZE * 0.52

    let minX = 1
    let maxX = 0
    let minY = 1
    let maxY = 0

    for (const [sx, sy, sz] of CORNER_SIGNS) {
      corner.current.set(
        center.current.x + sx * half,
        center.current.y + sy * half,
        center.current.z + sz * half,
      )
      ndc.current.copy(corner.current).project(camera)
      const px = (ndc.current.x + 1) / 2
      const py = (1 - ndc.current.y) / 2
      if (px < minX) minX = px
      if (px > maxX) maxX = px
      if (py < minY) minY = py
      if (py > maxY) maxY = py
    }

    // Clamp to viewport; keep a usable silhouette even if projection clips
    const left = THREE.MathUtils.clamp(minX, 0.02, 0.9)
    const right = THREE.MathUtils.clamp(maxX, 0.1, 0.98)
    const top = THREE.MathUtils.clamp(minY, 0.06, 0.85)
    const bottom = THREE.MathUtils.clamp(maxY, 0.15, 0.94)
    const width = Math.max(0.08, right - left)
    const height = Math.max(0.08, bottom - top)
    const cx = (left + right) / 2
    const cy = (top + bottom) / 2

    const preferRight = cx < 0.55
    // Park just outside the measured silhouette (+ small gutter scaled by cube width)
    const gutter = THREE.MathUtils.clamp(width * 0.12, 0.025, 0.05)
    const x = THREE.MathUtils.clamp(
      preferRight ? right + gutter : left - gutter,
      0.08,
      0.92,
    )
    const y = THREE.MathUtils.clamp(cy - height * 0.08, 0.18, 0.55)

    tip.current
      .copy(center.current)
      .addScaledVector(FLOOR_S_DIR, FLOOR_ARROW_DIST + FLOOR_ARROW_SIZE[1] * 0.35)
    tip.current.y = 0.03
    ndc.current.copy(tip.current).project(camera)
    const hx = THREE.MathUtils.clamp((ndc.current.x + 1) / 2, 0.08, 0.92)
    // Sit just under the measured cube bottom, above footer
    const hy = THREE.MathUtils.clamp(
      Math.max((1 - ndc.current.y) / 2, bottom + 0.02),
      0.55,
      0.84,
    )

    const L = last.current
    if (
      Math.abs(left - L.left) < 0.008 &&
      Math.abs(right - L.right) < 0.008 &&
      Math.abs(top - L.top) < 0.008 &&
      Math.abs(bottom - L.bottom) < 0.008 &&
      Math.abs(hx - L.hx) < 0.01 &&
      Math.abs(hy - L.hy) < 0.01
    ) {
      return
    }
    last.current = { left, right, top, bottom, hx, hy }

    onAnchor({
      cube: { left, right, top, bottom, cx, cy, width, height },
      x,
      y,
      preferRight,
      rollHintX: hx,
      rollHintY: hy,
      rollAngleDeg: 0,
    })
  })

  return null
}

/** Target cube silhouette width as a fraction of the viewport. */
const TARGET_CUBE_WIDTH = 0.36

/**
 * Dolly the camera so the cube occupies a stable share of the page.
 * Runs on mount + resize; does not fight user orbit mid-drag.
 */
function FitCubeFraming({
  targetRef,
  controlsRef,
}: {
  targetRef: React.RefObject<THREE.Group | null>
  controlsRef: React.RefObject<OrbitControlsImpl | null>
}) {
  const { camera, size } = useThree()
  const center = useRef(new THREE.Vector3())
  const corner = useRef(new THREE.Vector3())
  const ndc = useRef(new THREE.Vector3())
  const lastW = useRef(0)

  const measureWidth = useCallback(() => {
    const cube = targetRef.current
    if (!cube) return 0
    cube.getWorldPosition(center.current)
    const half = CUBE_SIZE * 0.52
    let minX = 1
    let maxX = 0
    for (const [sx, sy, sz] of CORNER_SIGNS) {
      corner.current.set(
        center.current.x + sx * half,
        center.current.y + sy * half,
        center.current.z + sz * half,
      )
      ndc.current.copy(corner.current).project(camera)
      const px = (ndc.current.x + 1) / 2
      if (px < minX) minX = px
      if (px > maxX) maxX = px
    }
    return Math.max(0.05, maxX - minX)
  }, [camera, targetRef])

  const fit = useCallback(() => {
    const controls = controlsRef.current
    if (!controls || !targetRef.current) return

    const target = controls.target.clone()
    let radius = camera.position.distanceTo(target)
    const polar = controls.getPolarAngle()
    const azimuth = controls.getAzimuthalAngle()

    for (let i = 0; i < 8; i++) {
      camera.position.set(
        target.x + radius * Math.sin(polar) * Math.sin(azimuth),
        target.y + radius * Math.cos(polar),
        target.z + radius * Math.sin(polar) * Math.cos(azimuth),
      )
      camera.lookAt(target)
      camera.updateMatrixWorld()
      const w = measureWidth()
      if (Math.abs(w - TARGET_CUBE_WIDTH) < 0.012) break
      const scale = w / TARGET_CUBE_WIDTH
      radius = THREE.MathUtils.clamp(radius * scale, controls.minDistance, controls.maxDistance)
    }

    camera.position.set(
      target.x + radius * Math.sin(polar) * Math.sin(azimuth),
      target.y + radius * Math.cos(polar),
      target.z + radius * Math.sin(polar) * Math.cos(azimuth),
    )
    camera.lookAt(target)
    controls.update()
  }, [camera, controlsRef, measureWidth, targetRef])

  useEffect(() => {
    const id = window.setTimeout(fit, 80)
    const onResize = () => {
      if (Math.abs(size.width - lastW.current) < 8) return
      lastW.current = size.width
      fit()
    }
    lastW.current = size.width
    window.addEventListener('resize', onResize)
    return () => {
      window.clearTimeout(id)
      window.removeEventListener('resize', onResize)
    }
  }, [fit, size.width])

  return null
}

function RollingScene({
  enabled,
  locked,
  onFaceChange,
  onAnchor,
  allowTouchOrbit = true,
}: {
  enabled: boolean
  locked: boolean
  onFaceChange: (id: CubeStageId) => void
  onAnchor?: (a: CubeScreenAnchor) => void
  /** When false (coarse pointer), one-finger gestures scroll the page instead of orbiting. */
  allowTouchOrbit?: boolean
}) {
  const textures = useLoader(THREE.TextureLoader, FACE_URLS)
  const groupRef = useRef<THREE.Group>(null)
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const cameraRef = useRef<THREE.Camera | null>(null)
  const { camera } = useThree()
  cameraRef.current = camera

  const { busy } = useRollingCube({
    groupRef,
    cameraRef,
    enabled,
    locked,
    onFaceChange,
  })
  const busyRef = useRef(busy)
  busyRef.current = busy

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return
    controls.enableRotate = allowTouchOrbit && !busy && !locked
  }, [busy, locked, allowTouchOrbit])

  // E2E hook: set camera azimuth/polar around the cube without relying on mouse drag
  useEffect(() => {
    window.__tdwhereSetOrbit = (azimuthRad: number, polarRad?: number) => {
      const controls = controlsRef.current
      const cam = cameraRef.current
      if (!controls || !cam) return
      const target = controls.target
      const polar =
        polarRad ??
        THREE.MathUtils.clamp(controls.getPolarAngle(), controls.minPolarAngle, controls.maxPolarAngle)
      const radius = cam.position.distanceTo(target)
      const p = THREE.MathUtils.clamp(polar, controls.minPolarAngle, controls.maxPolarAngle)
      cam.position.set(
        target.x + radius * Math.sin(p) * Math.sin(azimuthRad),
        target.y + radius * Math.cos(p),
        target.z + radius * Math.sin(p) * Math.cos(azimuthRad),
      )
      cam.lookAt(target)
      controls.update()
    }
    return () => {
      delete window.__tdwhereSetOrbit
    }
  }, [])

  const maps = useMemo(
    () => (Array.isArray(textures) ? textures : [textures]),
    [textures],
  )

  return (
    <>
      <ambientLight intensity={1} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]}>
        <planeGeometry args={[28, 18]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <group ref={groupRef}>
        <mesh>
          <boxGeometry args={[CUBE_SIZE * 0.985, CUBE_SIZE * 0.985, CUBE_SIZE * 0.985]} />
          <meshBasicMaterial color="#1e1a16" />
        </mesh>
        <CubeMesh textures={maps} />
      </group>

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enablePan={false}
        enableZoom={allowTouchOrbit}
        enableRotate={allowTouchOrbit}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.55}
        minDistance={6.5}
        maxDistance={16}
        minPolarAngle={0.12}
        maxPolarAngle={1.05}
        target={[0, CUBE_SIZE * 0.2, 0]}
      />
      <FitCubeFraming targetRef={groupRef} controlsRef={controlsRef} />
      <FollowControls targetRef={groupRef} controlsRef={controlsRef} busyRef={busyRef} />
      <FloorRollArrow targetRef={groupRef} />
      <ScreenAnchorReporter targetRef={groupRef} onAnchor={onAnchor} />
    </>
  )
}

type Props = {
  enabled?: boolean
  locked?: boolean
  onFaceChange: (id: CubeStageId) => void
  onAnchor?: (a: CubeScreenAnchor) => void
  className?: string
}

export default function MuseumCubeCanvas({
  enabled = true,
  locked = false,
  onFaceChange,
  onAnchor,
  className,
}: Props) {
  const [ready, setReady] = useState(false)
  /** One-finger drag orbits on mouse; on touch, let the page scroll instead. */
  const [touchOrbit, setTouchOrbit] = useState(false)

  useEffect(() => {
    setReady(true)
    const coarse = window.matchMedia('(pointer: coarse)')
    setTouchOrbit(coarse.matches)
    const onChange = () => setTouchOrbit(coarse.matches)
    coarse.addEventListener('change', onChange)
    return () => coarse.removeEventListener('change', onChange)
  }, [])

  if (!ready) {
    return (
      <div className={`${className ?? ''} flex items-center justify-center`}>
        <div className="h-12 w-12 animate-pulse rounded-sm bg-museum-stone/70" />
      </div>
    )
  }

  return (
    <div
      className={className}
      style={{ touchAction: touchOrbit ? 'pan-y' : 'none' }}
    >
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: INITIAL_CAM.toArray() as [number, number, number], fov: 32, near: 0.1, far: 60 }}
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: THREE.NoToneMapping,
          preserveDrawingBuffer: true,
        }}
        style={{ touchAction: touchOrbit ? 'pan-y' : 'none' }}
        onCreated={({ camera, gl }) => {
          camera.lookAt(0, CUBE_SIZE * 0.2, 0)
          gl.setClearColor(0x000000, 0)
        }}
      >
        <Suspense fallback={null}>
          <RollingScene
            enabled={enabled}
            locked={locked}
            onFaceChange={onFaceChange}
            onAnchor={onAnchor}
            allowTouchOrbit={!touchOrbit}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}
