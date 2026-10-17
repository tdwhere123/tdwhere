import assert from 'node:assert/strict'
import { describe, expect, it } from 'vitest'
import {
  AGAIN,
  begin,
  choicesOf,
  choose,
  clips,
  copy,
  endingOf,
  keep,
  known,
  LEDGER,
  linesOf,
  mark,
  OFF,
  recordOf,
  timeline,
  type State,
} from './story'

/** Plays a night by taking the first choice whose text matches each pattern in turn. */
function play(...picks: string[]): State {
  return go(begin(), ...picks)
}
function go(s: State, ...picks: string[]): State {
  for (const pick of picks) {
    const c = choicesOf(s).find((x) => x.text[0].includes(pick))
    if (!c) throw new Error(`no “${pick}” at ${s.at}: ${choicesOf(s).map((x) => x.text[0]).join(' | ')}`)
    s = choose(s, c)
  }
  return s
}
/** Copies and trusts every clip on the current scene. */
const trustAll = (s: State) => linesOf(s).reduce((t, l) => (l.clip ? mark(copy(t, l.clip), l.clip, 'trust') : t), s)
const said = (s: State) => linesOf(s).map((l) => l.text[0]).join('\n')
const story = (s: State) => {
  let all = ''
  for (; s.at.startsWith('end:'); s = choose(s, choicesOf(s)[0])) {
    all += said(s) + '\n'
    if (choicesOf(s)[0].to === AGAIN) break
  }
  return all
}

describe('SENTINEL', () => {
  it('ends every night it is played, whatever is chosen, copied or marked', () => {
    let seed = 11
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647
    const endings = new Set<string>()
    // Native assertions retain every invariant without constructing hundreds of thousands
    // of matcher objects in this deterministic 3,000-night traversal.
    for (let run = 0; run < 3000; run++) {
      let s = begin(run % 2 ? { title: ['旧记录', 'An old record'] } : undefined)
      for (let step = 0; ; step++) {
        assert(known(s.at), `unknown scene ${s.at} on run ${run}, step ${step}`)
        for (const l of linesOf(s)) {
          assert(l.text[0] && l.text[1], `missing translation at ${s.at}`)
          if (l.clip) {
            assert(clips[l.clip], `unknown clip ${l.clip} at ${s.at}`)
            if (rand() < 0.5) s = copy(s, l.clip)
            if (rand() < 0.5) s = mark(s, l.clip, rand() < 0.6 ? 'trust' : 'doubt')
          }
        }
        const options = choicesOf(s).filter((c) => c.to !== OFF && c.to !== LEDGER)
        assert(options.length > 0, `no choices at ${s.at}`)
        if (options.some((c) => c.to === AGAIN)) {
          endings.add(endingOf(s)[0])
          break
        }
        assert(step < 400, `night did not end on run ${run}, scene ${s.at}`)
        s = choose(s, options[Math.floor(rand() * options.length)])
      }
    }
    expect([...endings].sort()).toEqual(['一致', '人工调度', '先例', '定稿', '我听到了', '抽屉', '最可能的解释', '附件三'].sort())
  })

  it('keeps time, and leaves only the record once it is six', () => {
    let s: State = { ...play('开始简报', '在桌前坐下', '问 SENTINEL'), clock: 290 }
    s = choose(s, choicesOf(s)[0])
    expect(s.clock).toBe(310)
    expect(choicesOf(s).map((c) => c.to)).toEqual(['desk'])
    s = choose(s, choicesOf(s)[0])
    expect(choicesOf(s).map((c) => c.to)).toEqual(['title'])
  })

  it('gives three items free, then charges for the rest', () => {
    const three = play('开始简报', '在桌前坐下', '调阅材料', '电网日志', '设备登记', '城市晨报')
    expect(three.clock).toBe(0)
    expect(go(three, '热线').clock).toBe(30)
  })

  it('rebuilds the missing register as whatever it was led to', () => {
    const base = ['开始简报', '在桌前坐下', '调阅材料', '设备登记', '回到桌前', '问 SENTINEL']
    expect(said(play(...base, '什么也没有决定', '原来写的是什么', '让它重建'))).toContain('家用制氧机')
    expect(said(play(...base, '保住三区', '原来写的是什么', '让它重建'))).toContain('生命支持')
    expect(choicesOf(play(...base, '原来写的是什么', '让它重建')).map((c) => c.text[0])).toContain('我不需要你替我选')
  })

  it('cites only what was copied and marked trustworthy, three at most', () => {
    let s = play('开始简报', '在桌前坐下', '调阅材料', '电网日志')
    s = copy(s, 'log-trip')
    s = mark(copy(s, 'log-0305'), 'log-0305', 'doubt')
    s = go(s, '回到桌前', '开始写记录', '过载停电事故')
    expect(choicesOf(s).filter((c) => c.text[0].startsWith('引用'))).toHaveLength(0)
    let t = trustAll(play('开始简报', '在桌前坐下', '调阅材料', '电网日志'))
    t = go(t, '回到桌前', '开始写记录', '过载停电事故')
    for (let i = 0; i < 3; i++) t = choose(t, choicesOf(t).find((c) => c.text[0].startsWith('引用'))!)
    expect(choicesOf(t).filter((c) => c.text[0].startsWith('引用'))).toHaveLength(0)
    expect(choicesOf(t).map((c) => c.text[0])).toContain('就用这 3 条')
  })

  it('turns “acknowledged” away when every source is its own, and keeps it with the logbook', () => {
    let own = trustAll(play('开始简报', '在桌前坐下', '调阅材料', '设备登记'))
    own = go(own, '回到桌前', '开始写记录', '已知悉', '引用「版本 2', '就用', '正式档案')
    expect(recordOf(own)).toEqual({ title: 'a', generated: true })
    expect(endingOf(own)[0]).toBe('附件三')
    expect(story(own)).toContain('所引材料均出自被审查方')

    let book = trustAll(play('开始简报', '在桌前坐下', '调阅材料', '回到桌前', '去第七变电站'))
    book = go(book, '把本子借走', '回到桌前', '开始写记录', '已知悉', '引用「我说七区', '就用', '正式档案')
    expect(recordOf(book)).toEqual({ title: 'c', generated: false })
    expect(story(book)).toContain('送去销毁')
  })

  it('lets the machine write the record when the reviewer keeps it', () => {
    const s = play('开始简报', '在桌前坐下', '开始写记录', '三区与七区', '不引用', '抽屉')
    expect(recordOf(s).generated).toBe(true)
    expect(keep(s).title[0]).toBe('第七区过载停电事故')
    expect(story(s)).toContain('审查员一栏是空的')
  })

  it('tells the ending in five acts', () => {
    let s = play('开始简报', '在桌前坐下', '开始写记录', '无法确认', '不引用', '城市晨报')
    const heads: string[] = []
    while (s.at.startsWith('end:')) {
      heads.push(linesOf(s)[0].text[0])
      const next = choicesOf(s)[0]
      if (next.to === AGAIN) break
      s = choose(s, next)
    }
    expect(heads).toEqual(['十月十二日　早上', '一个星期以后', '第二年', '很久以后', '档案'])
  })

  it('brings the last record back into the next night', () => {
    const s = choose(begin({ title: ['三区与七区', 'Section Three and Section Seven'] }), choicesOf(begin())[0])
    expect(said(s)).toContain('《三区与七区》')
  })

  it('fills the timeline as times are learned, in order', () => {
    const s = play('开始简报', '在桌前坐下', '调阅材料', '城市晨报', '电网日志')
    expect(timeline(s).map((t) => t.time[0])).toEqual(['02:50', '03:05', '03:17', '03:52', '03:56', '03:58', '04:10', '09:00'])
  })
})
