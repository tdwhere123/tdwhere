import { describe, expect, it } from 'vitest'
import { onPaint, paint } from './bus'

describe('paint bus', () => {
  it('replays the latest glaze when an engine subscribes later', () => {
    const heard: string[] = []
    paint('glaze-replay', { type: 'glaze', color: [0.86, 0.84, 1.1] })
    const stop = onPaint('glaze-replay', (signal) => {
      if (signal.type === 'glaze') heard.push(signal.color?.join(',') ?? 'clear')
    })
    expect(heard).toEqual(['0.86,0.84,1.1'])
    paint('glaze-replay', { type: 'glaze', color: [1.1, 0.96, 0.76] })
    expect(heard).toEqual(['0.86,0.84,1.1', '1.1,0.96,0.76'])
    stop()
  })
})

describe('paint bus scenes', () => {
  it('replays the latest scene alongside the glaze', () => {
    const heard: string[] = []
    paint('scene-replay', { type: 'scene', at: 0.4 })
    paint('scene-replay', { type: 'scene', at: 1.2 })
    paint('scene-replay', { type: 'drag', x0: 0, y0: 0, x1: 1, y1: 1 })
    const stop = onPaint('scene-replay', (signal) => heard.push(signal.type === 'scene' ? `scene ${signal.at}` : signal.type))
    expect(heard).toEqual(['scene 1.2'])
    stop()
  })
})

describe('paint bus light', () => {
  it('replays the sky independently from glaze and suspension', () => {
    const light = { direction: [0.4, 0.8] as [number, number], tint: [1, .9, .8] as [number, number, number], shade: [.4, .6, .8] as [number, number, number], exposure: 1, sun: .8 }
    paint('sky-replay', { type: 'light', value: light })
    paint('sky-replay', { type: 'suspend', value: true })
    const heard: unknown[] = []
    const off = onPaint('sky-replay', (signal) => heard.push(signal))
    expect(heard).toEqual([{ type: 'light', value: light }, { type: 'suspend', value: true }])
    off()
  })
})

describe('paint bus occlusion', () => {
  it('replays suspension to a late-mounted home painting and releases it', () => {
    paint('home-occlusion', { type: 'suspend', value: true })
    const states: boolean[] = []
    const stop = onPaint('home-occlusion', s => {
      if (s.type === 'suspend') states.push(s.value)
    })
    paint('home-occlusion', { type: 'suspend', value: false })
    expect(states).toEqual([true, false])
    stop()
    const late: boolean[] = []
    const cleanup = onPaint('home-occlusion', s => {
      if (s.type === 'suspend') late.push(s.value)
    })
    expect(late).toEqual([false])
    cleanup()
  })
})
