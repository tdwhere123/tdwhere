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
