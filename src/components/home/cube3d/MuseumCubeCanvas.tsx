import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { CubeFacePosition, CubeStageId } from '../cube-data'
import { CUBE_SIZE, useRollingCube } from './useRollingCube'

const MATERIAL_FACES: CubeFacePosition[] = [
  'right',
  'left',
  'top',
  'bottom',
  'front',
  'back',
]

const FACE_URLS = MATERIAL_FACES.map((face) => `/cube/faces/${face}.png`)

/** Near-top view (~80°): cube reads upright on the plane. */
const INITIAL_CAM = new THREE.Vector3(0, 9.2, 1.65)

export type CubeScreenAnchor = {
  x: number
  y: number
  preferRight: boolean
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

function ScreenAnchorReporter({
  targetRef,
  onAnchor,
}: {
  targetRef: React.RefObject<THREE.Group | null>
  onAnchor?: (a: CubeScreenAnchor) => void
}) {
  const { camera } = useThree()
  const v = useRef(new THREE.Vector3())
  const last = useRef({ x: 0, y: 0 })

  useFrame(() => {
    if (!onAnchor || !targetRef.current) return
    targetRef.current.getWorldPosition(v.current)
    v.current.y = 0.04
    v.current.z += CUBE_SIZE * 0.55
    v.current.project(camera)
    const x = (v.current.x + 1) / 2
    const y = (1 - v.current.y) / 2
    if (Math.abs(x - last.current.x) < 0.004 && Math.abs(y - last.current.y) < 0.004) return
    last.current = { x, y }
    onAnchor({
      x: THREE.MathUtils.clamp(x, 0.1, 0.9),
      y: THREE.MathUtils.clamp(y, 0.2, 0.86),
      preferRight: x < 0.55,
    })
  })

  return null
}

function RollingScene({
  enabled,
  locked,
  onFaceChange,
  onAnchor,
}: {
  enabled: boolean
  locked: boolean
  onFaceChange: (id: CubeStageId) => void
  onAnchor?: (a: CubeScreenAnchor) => void
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
    controls.enableRotate = !busy && !locked
  }, [busy, locked])

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
        enableZoom
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.55}
        minDistance={5.5}
        maxDistance={14}
        minPolarAngle={0.12}
        maxPolarAngle={1.05}
        target={[0, CUBE_SIZE * 0.2, 0]}
      />
      <FollowControls targetRef={groupRef} controlsRef={controlsRef} busyRef={busyRef} />
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

  useEffect(() => {
    setReady(true)
  }, [])

  if (!ready) {
    return (
      <div className={`${className ?? ''} flex items-center justify-center`}>
        <div className="h-12 w-12 animate-pulse rounded-sm bg-museum-stone/70" />
      </div>
    )
  }

  return (
    <div className={className}>
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: INITIAL_CAM.toArray() as [number, number, number], fov: 32, near: 0.1, far: 60 }}
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: THREE.NoToneMapping,
          preserveDrawingBuffer: true,
        }}
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
          />
        </Suspense>
      </Canvas>
    </div>
  )
}
