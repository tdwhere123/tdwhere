import { expect, it } from 'vitest'
import * as THREE from 'three'
import { mountOverture } from '../overture'

it('rejects broken asset contracts before touching the canvas or allocating WebGL', () => {
  const canvas = { style: { touchAction: 'pan-y' } } as HTMLCanvasElement
  expect(() => mountOverture({
    canvas,
    clock: { start: Date.now(), hour: 12, season: 1, seed: 'test' },
    models: { coot: new THREE.Group(), aerator: new THREE.Group() },
    painting: () => canvas,
    focus: [0, 0],
    onDone: () => undefined,
    onFeedback: () => undefined,
  })).toThrow('Missing aerator wheel_0')
  expect(canvas.style.touchAction).toBe('pan-y')
})
