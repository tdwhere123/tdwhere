import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import gsap from 'gsap'
import type { CubeFacePosition, CubeStageId } from '../cube-data'
import { cubeProjects } from '../cube-data'

export const CUBE_SIZE = 1.85
const ROLL_SEC = 0.72
/** Soft roam bounds on the museum floor (world units). */
const BOUND_X = 3.2
const BOUND_Z = 2.0

export type RollDir = 'px' | 'nx' | 'pz' | 'nz'

const FACE_LOCAL: Record<CubeFacePosition, THREE.Vector3> = {
  right: new THREE.Vector3(1, 0, 0),
  left: new THREE.Vector3(-1, 0, 0),
  top: new THREE.Vector3(0, 1, 0),
  bottom: new THREE.Vector3(0, -1, 0),
  front: new THREE.Vector3(0, 0, 1),
  back: new THREE.Vector3(0, 0, -1),
}

const FACE_TO_ID = Object.fromEntries(
  cubeProjects.map((p) => [p.face, p.id]),
) as Record<CubeFacePosition, CubeStageId>

const UP = new THREE.Vector3(0, 1, 0)
const _forward = new THREE.Vector3()
const _right = new THREE.Vector3()
const _pivot = new THREE.Vector3()
const _offset = new THREE.Vector3()
const _axis = new THREE.Vector3()
const _qDelta = new THREE.Quaternion()

/**
 * Edge-pivot recipes (Y-up, XZ floor).
 * Pivot = centre + (half toward move, half down); rotate ±90° about rim axis.
 * Same kinematics as the Three.js pivot.attach() cycle, without reparenting.
 */
const ROLL: Record<
  RollDir,
  { move: THREE.Vector3; pivot: THREE.Vector3; axis: THREE.Vector3; angle: number }
> = {
  px: {
    move: new THREE.Vector3(1, 0, 0),
    pivot: new THREE.Vector3(0.5, -0.5, 0),
    axis: new THREE.Vector3(0, 0, -1),
    angle: Math.PI / 2,
  },
  nx: {
    move: new THREE.Vector3(-1, 0, 0),
    pivot: new THREE.Vector3(-0.5, -0.5, 0),
    axis: new THREE.Vector3(0, 0, 1),
    angle: Math.PI / 2,
  },
  pz: {
    move: new THREE.Vector3(0, 0, 1),
    pivot: new THREE.Vector3(0, -0.5, 0.5),
    axis: new THREE.Vector3(1, 0, 0),
    angle: Math.PI / 2,
  },
  nz: {
    move: new THREE.Vector3(0, 0, -1),
    pivot: new THREE.Vector3(0, -0.5, -0.5),
    axis: new THREE.Vector3(-1, 0, 0),
    angle: Math.PI / 2,
  },
}

function clampBounds(x: number, z: number) {
  return {
    x: THREE.MathUtils.clamp(x, -BOUND_X, BOUND_X),
    z: THREE.MathUtils.clamp(z, -BOUND_Z, BOUND_Z),
  }
}

function snapToCardinal(v: THREE.Vector3) {
  if (Math.abs(v.x) >= Math.abs(v.z)) {
    return new THREE.Vector3(Math.sign(v.x) || 1, 0, 0)
  }
  return new THREE.Vector3(0, 0, Math.sign(v.z) || 1)
}

function pickUpFace(quaternion: THREE.Quaternion): CubeFacePosition {
  let best: CubeFacePosition = 'top'
  let bestDot = -Infinity
  const world = new THREE.Vector3()

  for (const [face, local] of Object.entries(FACE_LOCAL) as [
    CubeFacePosition,
    THREE.Vector3,
  ][]) {
    world.copy(local).applyQuaternion(quaternion)
    const d = world.dot(UP)
    if (d > bestDot) {
      bestDot = d
      best = face
    }
  }
  return best
}

function snapQuatToAxes(q: THREE.Quaternion) {
  const m = new THREE.Matrix4().makeRotationFromQuaternion(q)
  const x = new THREE.Vector3()
  const y = new THREE.Vector3()
  const z = new THREE.Vector3()
  m.extractBasis(x, y, z)

  const snap = (v: THREE.Vector3) => {
    const ax = Math.abs(v.x)
    const ay = Math.abs(v.y)
    const az = Math.abs(v.z)
    if (ax >= ay && ax >= az) v.set(Math.sign(v.x) || 1, 0, 0)
    else if (ay >= ax && ay >= az) v.set(0, Math.sign(v.y) || 1, 0)
    else v.set(0, 0, Math.sign(v.z) || 1)
  }

  snap(x)
  snap(y)
  z.crossVectors(x, y)
  if (z.lengthSq() < 0.5) {
    snap(z)
    y.crossVectors(z, x)
  }
  x.normalize()
  y.normalize()
  z.normalize()
  m.makeBasis(x, y, z)
  return new THREE.Quaternion().setFromRotationMatrix(m)
}

function moveToRollKey(move: THREE.Vector3): RollDir | null {
  const x = Math.round(move.x)
  const z = Math.round(move.z)
  if (x === 1 && z === 0) return 'px'
  if (x === -1 && z === 0) return 'nx'
  if (x === 0 && z === 1) return 'pz'
  if (x === 0 && z === -1) return 'nz'
  return null
}

type Options = {
  groupRef: React.RefObject<THREE.Group | null>
  cameraRef: React.RefObject<THREE.Camera | null>
  enabled: boolean
  locked?: boolean
  onFaceChange: (id: CubeStageId) => void
}

export function useRollingCube({
  groupRef,
  cameraRef,
  enabled,
  locked = false,
  onFaceChange,
}: Options) {
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)
  const lockedRef = useRef(locked)
  lockedRef.current = locked
  const tweenRef = useRef<gsap.core.Tween | null>(null)
  const onFaceChangeRef = useRef(onFaceChange)
  onFaceChangeRef.current = onFaceChange

  const syncFacing = useCallback(() => {
    const group = groupRef.current
    if (!group) return
    const face = pickUpFace(group.quaternion)
    const id = FACE_TO_ID[face]
    queueMicrotask(() => onFaceChangeRef.current(id))
  }, [groupRef])

  const dirFromKey = useCallback(
    (key: RollDir) => {
      const cam = cameraRef.current
      if (cam) {
        cam.getWorldDirection(_forward)
        _forward.y = 0
        if (_forward.lengthSq() < 1e-6) _forward.set(0, 0, -1)
        _forward.normalize()
        _forward.copy(snapToCardinal(_forward))
        _right.crossVectors(_forward, UP).normalize()
      } else {
        _forward.set(0, 0, -1)
        _right.set(1, 0, 0)
      }

      switch (key) {
        case 'pz':
          return _forward.clone()
        case 'nz':
          return _forward.clone().multiplyScalar(-1)
        case 'px':
          return _right.clone()
        case 'nx':
          return _right.clone().multiplyScalar(-1)
      }
    },
    [cameraRef],
  )

  const roll = useCallback(
    (key: RollDir): boolean => {
      if (!enabled || lockedRef.current || busyRef.current) return false
      const group = groupRef.current
      if (!group) return false

      const move = dirFromKey(key)
      if (move.lengthSq() < 1e-6) return false
      const recipeKey = moveToRollKey(snapToCardinal(move))
      if (!recipeKey) return false
      const recipe = ROLL[recipeKey]
      const s = CUBE_SIZE

      const startPos = group.position.clone()
      const startQuat = group.quaternion.clone()
      const endX = startPos.x + recipe.move.x * s
      const endZ = startPos.z + recipe.move.z * s
      const clamped = clampBounds(endX, endZ)
      if (Math.abs(clamped.x - endX) > 0.01 || Math.abs(clamped.z - endZ) > 0.01) {
        return false
      }

      const landX = Math.round(endX / s) * s
      const landZ = Math.round(endZ / s) * s
      const land = clampBounds(landX, landZ)

      _pivot.set(
        startPos.x + recipe.pivot.x * s,
        startPos.y + recipe.pivot.y * s,
        startPos.z + recipe.pivot.z * s,
      )
      _offset.copy(startPos).sub(_pivot)
      _axis.copy(recipe.axis)

      const pivot = _pivot.clone()
      const offset0 = _offset.clone()
      const axis = _axis.clone()
      const angle = recipe.angle
      const endQuat = snapQuatToAxes(
        new THREE.Quaternion().setFromAxisAngle(axis, angle).multiply(startQuat),
      )

      busyRef.current = true
      setBusy(true)
      tweenRef.current?.kill()

      const proxy = { t: 0 }
      tweenRef.current = gsap.to(proxy, {
        t: 1,
        duration: ROLL_SEC,
        ease: 'power3.inOut',
        onUpdate: () => {
          const a = angle * proxy.t
          _qDelta.setFromAxisAngle(axis, a)
          group.position.copy(offset0).applyQuaternion(_qDelta).add(pivot)
          group.quaternion.copy(_qDelta).multiply(startQuat)
        },
        onComplete: () => {
          group.position.set(land.x, s / 2, land.z)
          group.quaternion.copy(endQuat)
          busyRef.current = false
          setBusy(false)
          syncFacing()
        },
      })

      return true
    },
    [dirFromKey, enabled, groupRef, syncFacing],
  )

  useEffect(() => {
    const group = groupRef.current
    if (!group) return
    group.position.set(0, CUBE_SIZE / 2, 0)
    group.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2)
    const id = requestAnimationFrame(() => syncFacing())
    return () => cancelAnimationFrame(id)
  }, [groupRef, syncFacing])

  useEffect(() => {
    if (!enabled) return

    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      const map: Record<string, RollDir> = {
        ArrowRight: 'px',
        KeyD: 'px',
        ArrowLeft: 'nx',
        KeyA: 'nx',
        ArrowUp: 'pz',
        KeyW: 'pz',
        ArrowDown: 'nz',
        KeyS: 'nz',
      }
      const dir = map[e.code]
      if (!dir) return
      e.preventDefault()
      roll(dir)
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled, roll])

  useEffect(() => {
    return () => {
      tweenRef.current?.kill()
      busyRef.current = false
    }
  }, [])

  return { busy, roll }
}
