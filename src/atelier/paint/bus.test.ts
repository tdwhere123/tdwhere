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
