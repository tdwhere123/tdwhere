import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// A stand-in for three's WebGLRenderer: no GL, just a record of what the stage asks of it.
const gl = vi.hoisted(() => ({
  log: [] as string[],
  failCompile: false,
  instances: [] as { canvas: unknown }[],
}))

vi.mock('three', async (importOriginal) => {
  const three = await importOriginal<typeof import('three')>()
  class WebGLRenderer {
    shadowMap = { enabled: false, type: 0 }
    canvas: unknown
    constructor(o: { canvas: unknown }) {
      this.canvas = o.canvas
      gl.instances.push(this)
      gl.log.push('new')
    }
    setClearColor() {}
    setPixelRatio(r: number) {
      gl.log.push(`pixelRatio ${r}`)
    }
    setSize(w: number, h: number) {
      gl.log.push(`size ${w}x${h}`)
    }
    setRenderTarget(t: unknown) {
      gl.log.push(t ? 'target' : 'screen')
    }
    render(scene: { children: unknown[] }) {
      gl.log.push(`render ${scene.children.length}`)
    }
    compileAsync(scene: unknown) {
      gl.log.push('compile')
      if (gl.failCompile) throw new Error('compile failed')
      return Promise.resolve(scene)
    }
    dispose() {
      gl.log.push('dispose')
    }
    forceContextLoss() {
      gl.log.push('loseContext')
    }
  }
  return { ...three, WebGLRenderer }
})

import { createStage } from './stage'

let frames: FrameRequestCallback[] = []
const canvas = () => ({}) as HTMLCanvasElement
const overlay = () => ({ style: {} as Record<string, string> }) as unknown as HTMLElement
const flush = () => new Promise((r) => setTimeout(r, 0))
const runFrame = (now: number) => {
  const f = frames.shift()
  f?.(now)
}

beforeEach(() => {
  gl.log.length = 0
  gl.instances.length = 0
  gl.failCompile = false
  frames = []
  vi.stubGlobal('window', { devicePixelRatio: 1 })
  vi.stubGlobal('requestAnimationFrame', (f: FrameRequestCallback) => frames.push(f))
  vi.stubGlobal('cancelAnimationFrame', () => {})
})
afterEach(() => {
  vi.unstubAllGlobals()
})

describe('machine stage lifetime', () => {
  it('loses the WebGL context after disposing the renderer', () => {
    const s = createStage(canvas(), overlay(), true)
    s.dispose()
    expect(gl.log.filter((l) => l === 'loseContext')).toHaveLength(1)
    expect(gl.log.slice(-2)).toEqual(['dispose', 'loseContext'])
  })

  it('releases the renderer and its context when set-up throws', () => {
    gl.failCompile = true
    expect(() => createStage(canvas(), overlay(), true)).toThrow('compile failed')
    expect(gl.log.filter((l) => l === 'dispose')).toHaveLength(1)
    expect(gl.log.filter((l) => l === 'loseContext')).toHaveLength(1)
    expect(gl.log.indexOf('dispose')).toBeLessThan(gl.log.indexOf('loseContext'))
  })

  it('stops touching the renderer and the overlay once disposed', () => {
    const ov = overlay()
    const s = createStage(canvas(), ov, true)
    s.dispose()
    const before = { log: gl.log.length, style: { ...ov.style } }
    s.resize(640, 480)
    expect(gl.log.length).toBe(before.log)
    expect({ ...ov.style }).toEqual(before.style)
  })
})

// Recorded on main 1b7c8b1a; must hold before and after the lifetime fix.
describe('machine stage drawing is unchanged', () => {
  const pass = ['target', 'render 8', 'screen', 'render 1']
  const setUp = ['new', 'target', 'compile', 'screen', 'compile', 'pixelRatio 1', 'size 640x480']
  it.each([
    {
      quiet: true,
      frames: 2,
      pending: 0,
      transform:
        'matrix3d(0.9415984660528964,-0.017859427883062783,0,-0.0001426636211170518,0.03353089908026419,1.0114118988025884,0,0.00010478405962582486,0,0,1,0,190.9668783895182,130.00290686469825,0,1)',
    },
    {
      quiet: false,
      frames: 5,
      pending: 1,
      transform:
        'matrix3d(0.5943673766989798,-0.0129856941922849,0,-0.0002748228664675394,0.041359294795834375,0.7556649974306568,0,0.00012924779623698306,0,0,1,0,184.00307053395153,138.76666236640705,0,1)',
    },
  ])('quiet $quiet: same passes and overlay', async ({ quiet, frames: n, pending, transform }) => {
    const ov = overlay()
    const s = createStage(canvas(), ov, quiet)
    s.resize(640, 480)
    await flush()
    runFrame(1000)
    s.setPowered(true)
    for (let t = 1016; frames.length && t < 1016 + 16 * 4; t += 16) runFrame(t)
    expect(gl.log).toEqual([...setUp, ...Array.from({ length: n }, () => pass).flat()])
    expect(ov.style).toEqual({ width: '225px', height: '168.75px', transform })
    expect(frames).toHaveLength(pending)
  })
})
