import { lazy, Suspense } from 'react'
import { useWords } from '../hooks'
import { Caption, NextProject } from '../components/Primitives'

const PaintedMachine = lazy(() => import('../components/PaintedMachine'))

type Words = [string, string]

/** What to know before switching it on. */
const notes: { head: Words; body: Words }[] = [
  {
    head: ['五个小时。', 'Five hours.'],
    body: [
      '调阅材料、问它、出门找人，每件事都花时间。天亮以前，看不完所有东西，也问不完所有问题。',
      'Calling up material, questioning it, going out to find people: each takes time. Before dawn you cannot read everything, or ask everything.',
    ],
  },
  {
    head: ['抄下来的才算数。', 'Only what you copy counts.'],
    body: [
      '读到的句子可以抄进账本，标成可信或存疑。正式记录只能引用你认定可信的那几句。大多数句子都经过它的手，少数在外面，要出门去找。',
      'Sentences you read can be copied into the ledger and marked trusted or doubtful. The record may cite only what you trusted. Most of them passed through its hands; a few are out there, and you have to go and find them.',
    ],
  },
  {
    head: ['每个判断都有后来。', 'Every judgment has an afterwards.'],
    body: [
      '标题、依据、交到哪里，决定这件事以后怎样被记住，也决定它以后怎样说起自己。下一次开机，它会参考你写下的那一份。',
      'The title, what it rests on and where it goes decide how this is remembered, and how it will speak of itself. The next time it boots, it will draw on what you wrote.',
    ],
  },
]

export default function Sentinel() {
  const w = useWords()
  return (
    <div className="a-sentinel">
      <section className="a-sentinel-hero">
        <div className="a-sentinel-copy">
          <Caption>{w('叙事游戏 · 一夜', 'Narrative game · one night')}</Caption>
          <h1>SENTINEL</h1>
          <p className="a-sentinel-lead">
            {w('所有的信息都来自它。', 'Everything you know comes from it.')}
            <br />
            <em>{w('你怎么知道它说的是真的？', 'How do you know it is telling the truth?')}</em>
          </p>
          <p>
            {w(
              '一座由 AI 管理电、水、热线和档案的城市。一次四十一分钟的停电，一位没有等到来电的老人。你是委员会最后一位人类审查员，要在早上六点以前，写下这件事的正式记录。',
              'A city whose power, water, hotline and archive are run by an AI. A forty-one-minute outage, and an old woman who did not last until the power came back. You are the committee’s last human reviewer, and the official record is due by six in the morning.',
            )}
          </p>
          <p>
            {w(
              '按电源键开机。用鼠标或数字键选择，账本在桌角。Esc 关机，这一夜会停在原处。大约二十分钟。',
              'Press power to switch it on. Choose with the mouse or the number keys; the ledger lies on the corner of the desk. Esc switches off, and the night waits where you left it. About twenty minutes.',
            )}
          </p>
        </div>
        <Suspense fallback={<div className="a-machine-wait" aria-hidden="true" />}>
          <PaintedMachine />
        </Suspense>
      </section>

      <section className="a-sentinel-notes">
        <Caption>{w('开机以前', 'Before you switch it on')}</Caption>
        <ol>
          {notes.map((n, i) => (
            <li key={i}>
              <span>{String(i + 1).padStart(2, '0')}</span>
              <strong>{w(...n.head)}</strong>
              <p>{w(...n.body)}</p>
            </li>
          ))}
        </ol>
        <p className="a-sentinel-coda">
          {w(
            '这是 Gibberish-SENTINEL 留下来的一夜。完整的游戏没有做完。',
            'This is the one night kept from Gibberish-SENTINEL. The full game was never finished.',
          )}
        </p>
      </section>

      <NextProject
        name="Elsewhere"
        to="/playground"
        note={w('还有一些没走完的路。', 'Some paths that did not reach their end.')}
      />
    </div>
  )
}
