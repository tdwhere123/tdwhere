import { describe, expect, it } from 'vitest'
import { collect } from './film'

describe('film collection', () => {
  const rolls = collect(
    {
      '../assets/film/first-roll/02.jpg': 'b',
      '../assets/film/first-roll/01.jpg': 'a',
      '../assets/film/2025-10-yichang/10.jpg': 'y10',
      '../assets/film/2025-10-yichang/9.jpg': 'y9',
      '../assets/film/2026-03/01.jpg': 'm',
      '../assets/film/2026-03/canister.png': 'can',
    },
    {
      '../assets/film/first-roll/roll.json': {
        title: { zh: '第一卷', en: 'First roll' },
        frames: { '01': { focus: '60% 50%' } },
      },
    },
  )
  it('puts the newest roll first and undated rolls last', () => {
    expect(rolls.map((r) => r.id)).toEqual(['2026-03', '2025-10-yichang', 'first-roll'])
  })
  it('reads the date and name from the folder', () => {
    expect(rolls[1]).toMatchObject({ date: '2025-10', title: { zh: 'yichang', en: 'yichang' } })
    expect(rolls[0]).toMatchObject({ date: '2026-03', title: { zh: '2026-03' } })
  })
  it('takes a canister picture for the shelf, not as a frame', () => {
    expect(rolls[0].canister).toBe('can')
    expect(rolls[0].frames.map((f) => f.name)).toEqual(['01'])
    expect(rolls[1].canister).toBeUndefined()
  })
  it('orders frames by number, not by text', () => {
    expect(rolls[1].frames.map((f) => f.name)).toEqual(['9', '10'])
  })
  it('takes titles and crops from roll.json and fills in the rest', () => {
    const first = rolls[2]
    expect(first.title.en).toBe('First roll')
    expect(first.frames[0]).toMatchObject({ id: 'first-roll/01', src: 'a', focus: '60% 50%' })
    expect(first.frames[1].focus).toBe('50% 50%')
    expect(first.frames[1].alt.zh).toBe('第一卷，第 2 格')
  })
})
