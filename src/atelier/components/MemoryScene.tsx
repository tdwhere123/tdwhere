import { useEffect, useRef, useState } from 'react'
import { Pause, Play, RotateCcw, ArrowRight, ChevronDown } from 'lucide-react'
import { evidence, recallFixture, type QueryId } from '../model'
import { useSequence, useWords } from '../hooks'
import { Art, Caption, DemoNote } from './Primitives'
import { paint } from '../paint/bus'
import { Constellation } from './Constellation'

function QuestionField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: QueryId
  options: { id: QueryId; label: string }[]
  onChange: (id: QueryId) => void
}) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('pointerdown', close)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', close)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])
  const current = options.find((option) => option.id === value)
  return (
    <div className="a-query" ref={root}>
      <span>{label}</span>
      <button
        type="button"
        className="a-query-current"
        aria-expanded={open}
        aria-haspopup="listbox"
        data-testid="memory-query"
        onClick={() => setOpen((open) => !open)}
      >
        {current?.label}
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      {open && (
        <ul className="a-query-list" role="listbox" aria-label={label}>
          {options.map((option) => (
            <li key={option.id}>
              <button
                type="button"
                role="option"
                aria-selected={option.id === value}
                onClick={() => {
                  onChange(option.id)
                  setOpen(false)
                }}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function recallLight(map: HTMLElement | null, x: number, y: number, amount: number, radius: number) {
  if (!map) return
  const r = map.getBoundingClientRect()
  paint('memory', { type: 'pulse', x: r.left + r.width * x, y: r.top + r.height * y, amount, radius })
}

const stages: [string, string][] = [
  ['提出问题', 'A question'],
  ['界定范围', 'A finite field'],
  ['激活线索', 'Activation'],
  ['关联展开', 'Propagation'],
  ['选择证据', 'Selection'],
]
const explanations: [string, string][] = [
  [
    '问题改变了，值得带回的过去也会改变。先选择下方的问题。',
    'A different question calls for a different past. Choose a question below.',
  ],
  [
    '先限定这次可以查看的记忆，不把所有历史都塞进上下文。',
    'Define the memories this request may inspect, rather than loading all history.',
  ],
  [
    '与问题直接有关的线索开始亮起。亮起只是候选，不代表已被采用。',
    'Directly related clues light up. Activation creates a candidate, not a verdict.',
  ],
  [
    '沿已有关系找到相邻证据；关联展开有边界，而不是无限扩散。',
    'Existing relations lead to neighboring evidence. Expansion is bounded, not unlimited.',
  ],
  [
    '在预算内选出当前有效、互相补充的证据，连同来源一起返回。',
    'Select current, complementary evidence within a budget, and return it with its sources.',
  ],
]
export default function MemoryScene({
  compact = false,
}: {
  compact?: boolean
}) {
  const w = useWords(),
    seq = useSequence(5)
  const [query, setQuery] = useState<QueryId>('design'),
    [budget, setBudget] = useState(3),
    [inspected, inspect] = useState('canvas')
  const result = recallFixture(query, budget),
    note = evidence.find((e) => e.id === inspected)!
  const map = useRef<HTMLDivElement>(null)
  const step = seq.step
  useEffect(() => {
    if (step < 2) return
    const { candidates, selected } = recallFixture(query, budget)
    if (step === 4)
      selected.forEach((e) => recallLight(map.current, e.x, e.y, 1, 0.08))
    else
      candidates
        .filter((e) => e.current)
        .forEach((e) => recallLight(map.current, e.x, e.y, step === 3 ? 0.55 : 0.35, 0.06))
  }, [step, query, budget])
  const labels: Record<QueryId, [string, string]> = {
    design: ['这次设计保留什么？', 'What should this design keep?'],
    ship: ['部署前需要检查什么？', 'What matters before shipping?'],
    access: ['手机和键盘如何访问？', 'What about touch and keyboard?'],
  }
  return (
    <div
      className={`a-memory-scene ${compact ? 'is-compact' : ''}`}
      data-testid="atelier-memory"
      data-stage={seq.step}
    >
      <div className="a-memory-header">
        <Caption number="01">
          {w('联想召回 / 机制习作', 'Associative recall / a mechanism study')}
        </Caption>
        <span className="a-micro">
          {w('探索中的方向', 'A research direction')}
        </span>
      </div>
      <div className="a-memory-map" ref={map}>
        <Art name="pigment" channel="memory" className="a-nebula-art" />
        <div className="a-orbit a-orbit-one" aria-hidden="true" />
        <div className="a-orbit a-orbit-two" aria-hidden="true" />
        <Constellation query={query} stage={seq.step} budget={budget} />
        <span className="a-field-word" aria-hidden="true">
          remember.
        </span>
        {evidence.map((e) => (
          <button
            key={e.id}
            className="a-star-label"
            style={{ left: `${e.x * 100}%`, top: `${e.y * 100}%` }}
            onClick={() => {
              inspect(e.id)
              recallLight(map.current, e.x, e.y, e.current ? 0.8 : 0.25, 0.05)
            }}
            aria-pressed={inspected === e.id}
            data-selected={
              seq.step === 4 && result.selected.some((n) => n.id === e.id)
            }
            data-active={seq.step >= 2 && e.query.includes(query) && e.current}
            data-stale={!e.current}
            aria-label={w(...e.title)}
          >
            <span />
            {w(...e.title)}
          </button>
        ))}
        <aside className="a-memory-inspector" aria-live="polite">
          <span className="a-micro">
            {w('一条记忆', 'A memory')} /{' '}
            {note.current
              ? w('当前有效', 'Current')
              : w('已被替代', 'Superseded')}
          </span>
          <h4>{w(...note.title)}</h4>
          <p>{w(...note.body)}</p>
          <small>
            {w('来源：', 'Source: ')}
            {w(...note.source)}
          </small>
        </aside>
      </div>
      <div className="a-memory-console">
        <QuestionField
          label={w('现在的问题', 'The present question')}
          value={query}
          options={(Object.keys(labels) as QueryId[]).map((id) => ({
            id,
            label: w(...labels[id]),
          }))}
          onChange={(id) => {
            setQuery(id)
            seq.reset()
          }}
        />
        <label className="a-budget">
          {w('证据预算', 'Evidence budget')} <output>{budget}</output>
          <input
            type="range"
            min="1"
            max="4"
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            aria-label={w(
              '最多返回的证据条数',
              'Maximum returned evidence count',
            )}
          />
        </label>
        <div className="a-playback">
          <button
            onClick={seq.play}
            aria-label={
              seq.playing ? w('暂停演示', 'Pause') : w('播放演示', 'Play')
            }
            data-testid="memory-play"
          >
            {seq.playing ? <Pause size={16} /> : <Play size={16} />}
            {seq.playing ? w('暂停', 'Pause') : w('走一遍', 'Trace it')}
          </button>
          <button onClick={seq.reset} aria-label={w('重置演示', 'Reset')}>
            <RotateCcw size={15} />
          </button>
        </div>
      </div>
      <div
        className="a-stages"
        role="group"
        aria-label={w('召回过程', 'Recall stages')}
      >
        {stages.map((s, i) => (
          <button
            key={s[1]}
            aria-pressed={seq.step === i}
            onClick={() => {
              seq.pause()
              seq.setStep(i)
            }}
            data-testid={`memory-stage-${i}`}
          >
            <span>0{i + 1}</span>
            {w(...s)}
          </button>
        ))}
      </div>
      <div className="a-memory-explanation">
        <p aria-live="polite">{w(...explanations[seq.step])}</p>
        <div
          className="a-evidence-result"
          data-testid="evidence-result"
          aria-live="polite"
        >
          {seq.step === 4 ? (
            <>
              <ArrowRight size={16} aria-hidden="true" />
              {result.selected.map((e) => (
                <button
                  key={e.id}
                  data-evidence={e.id}
                  onClick={() => inspect(e.id)}
                >
                  {w(...e.title)}
                </button>
              ))}
            </>
          ) : (
            <span>
              {w(
                '选择证据后，结果会留在这里。',
                'The selected evidence will appear here.',
              )}
            </span>
          )}
        </div>
      </div>
      <DemoNote />
    </div>
  )
}
