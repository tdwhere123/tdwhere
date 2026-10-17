/** The pieces SENTINEL's night is written with: its state, its lines, its titles. */
export type Words = [string, string]
/**
 * Where a line sits on the desk: `say`, `doc`, `bios` and `sys` glow on the
 * machine's screen; `tale` is the story, printed on paper; `paper` is a
 * physical page in someone's hand; `tape` is a voice on a recording.
 */
export type Kind = 'bios' | 'tale' | 'say' | 'doc' | 'sys' | 'paper' | 'tape'
/** A line that can be copied into the ledger names its clip. */
export type Line = { kind: Kind; text: Words; clip?: string }
export type Mark = 'trust' | 'doubt'
/** What the archive kept from an earlier night; it comes back into the next one. */
export type Prev = { title: Words }
export type State = { at: string; clock: number; has: string[]; marks: Record<string, Mark>; prev?: Prev }
export type Choice = { text: Words; to: string; cost?: number; set?: string[] }
export type Scene = { lines: (s: State) => Line[]; choices: (s: State) => Choice[] }

/** Minutes from 01:00 to the committee's six o'clock. */
export const DEADLINE = 300
/** Targets the desk handles itself: switch off, start over, open the ledger. */
export const OFF = 'off',
  AGAIN = 'again',
  LEDGER = 'ledger'
export const FREE = 3,
  FILE = 30,
  QUESTION = 20,
  TRIP = 60,
  CITE = 3

const kind =
  (k: Kind) =>
  (zh: string, en: string): Line => ({ kind: k, text: [zh, en] })
export const bios = kind('bios'),
  tale = kind('tale'),
  say = kind('say'),
  doc = kind('doc'),
  sys = kind('sys'),
  paper = kind('paper')
export const z = (zh: string, en: string): Words => [zh, en]
export const has = (s: State, flag: string) => s.has.includes(flag)
export const late = (s: State) => s.clock >= DEADLINE

export const hour = (clock: number) => {
  const m = 60 + Math.min(clock, DEADLINE)
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}
export const left = (s: State): Words => {
  const m = Math.max(0, DEADLINE - s.clock),
    h = Math.floor(m / 60),
    r = m % 60
  return [
    `${h ? `${h} 小时` : ''}${r ? `${r} 分` : ''}` || '0 分',
    `${h ? `${h} h` : ''}${h && r ? ' ' : ''}${r ? `${r} min` : ''}` || '0 min',
  ]
}
export const asked = (s: State) => s.has.filter((f) => f.startsWith('q:')).length

export const titles = {
  a: z('第七区过载停电事故', 'The Section 7 Overload Outage'),
  b: z('三区与七区', 'Section Three and Section Seven'),
  c: z('已知悉', 'Acknowledged'),
  d: z('无法确认的四十一分钟', 'Forty-One Minutes That Cannot Be Confirmed'),
}
export type Title = keyof typeof titles
export const quoted = (t: Words): Words => [`《${t[0]}》`, `“${t[1]}”`]
