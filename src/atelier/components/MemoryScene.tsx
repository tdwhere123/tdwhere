import { useEffect, useRef, useState } from 'react'
import { Pause, Play, RotateCcw, ArrowRight } from 'lucide-react'
import { evidence, graphEdges, recallFixture, type QueryId } from '../model'
import { useQuiet, useSequence, useWords } from '../hooks'
import { Art, Caption, DemoNote } from './Primitives'

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
function Constellation({
  query,
  stage,
  budget,
}: {
  query: QueryId
  stage: number
  budget: number
}) {
  const ref = useRef<HTMLCanvasElement>(null),
    quiet = useQuiet()
  useEffect(() => {
    const canvas = ref.current,
      ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    let frame = 0,
      visible = true,
      width = 0,
      height = 0,
      last = 0
    const selected = new Set(
      recallFixture(query, budget).selected.map((e) => e.id),
    )
    const active = new Set(
      evidence.filter((e) => e.query.includes(query)).map((e) => e.id),
    )
    const dots = Array.from({ length: 100 }, (_, i) => ({
      x: ((i * 73 + 17) % 997) / 997,
      y: ((i * 139 + 43) % 991) / 991,
      r: 0.5 + (i % 4) / 5,
    }))
    function draw(time: number) {
      if (!ctx) return
      const t = quiet ? 0 : time * 0.00015
      ctx.clearRect(0, 0, width, height)
      if (stage >= 2) {
        const centers = evidence.filter(
          (e) =>
            active.has(e.id) && e.current && (stage < 4 || selected.has(e.id)),
        )
        for (let i = 0; i < 130 && centers.length; i++) {
          const center = centers[i % centers.length],
            theta = i * 2.39996 + t * 0.07
          const radius = 15 + ((i * 37) % 95)
          const x = center.x * width + Math.cos(theta) * radius
          const y = center.y * height + Math.sin(theta) * radius * 0.65
          ctx.save()
          ctx.translate(x, y)
          ctx.rotate(Math.sin(i * 1.7 + t) * 0.4)
          ctx.fillStyle = ['#9eafa8', '#b59460', '#719397', '#b79872'][i % 4]
          ctx.globalAlpha =
            (stage === 4 ? 0.065 : 0.045) * (1 + Math.sin(i + t) * 0.15)
          ctx.beginPath()
          ctx.moveTo(-15, -3)
          ctx.quadraticCurveTo(0, -7, 21, -2)
          ctx.lineTo(16, 5)
          ctx.quadraticCurveTo(0, 6, -15, 2)
          ctx.closePath()
          ctx.fill()
          ctx.restore()
        }
      }
      dots.forEach((dot, i) => {
        const shimmer = 0.2 + 0.25 * (1 + Math.sin(t * 2 + i))
        ctx.fillStyle = `rgba(225,213,176,${shimmer})`
        ctx.beginPath()
        ctx.arc(dot.x * width, dot.y * height, dot.r, 0, Math.PI * 2)
        ctx.fill()
      })
      graphEdges.forEach(([a, b]) => {
        const from = evidence.find((e) => e.id === a)!,
          to = evidence.find((e) => e.id === b)!
        const lit =
          stage >= 3 &&
          active.has(a) &&
          active.has(b) &&
          from.current &&
          to.current
        ctx.strokeStyle = lit ? 'rgba(223,185,117,.7)' : 'rgba(179,198,205,.16)'
        ctx.lineWidth = lit ? 1.2 : 0.6
        ctx.setLineDash(from.current && to.current ? [] : [3, 6])
        ctx.beginPath()
        ctx.moveTo(from.x * width, from.y * height)
        ctx.quadraticCurveTo(
          ((from.x + to.x) / 2) * width + 25,
          ((from.y + to.y) / 2) * height - 28,
          to.x * width,
          to.y * height,
        )
        ctx.stroke()
      })
      ctx.setLineDash([])
      evidence.forEach((e, i) => {
        const lit = stage >= 2 && active.has(e.id) && e.current
        const chosen = stage >= 4 && selected.has(e.id)
        const x = e.x * width,
          y = e.y * height
        const radius = chosen ? 7 : lit ? 4 : 2
        if (lit) {
          const g = ctx.createRadialGradient(x, y, 0, x, y, chosen ? 65 : 30)
          g.addColorStop(
            0,
            chosen ? 'rgba(235,184,99,.4)' : 'rgba(157,186,212,.25)',
          )
          g.addColorStop(1, 'rgba(194,150,85,0)')
          ctx.fillStyle = g
          ctx.fillRect(x - 65, y - 65, 130, 130)
          ctx.beginPath()
          ctx.strokeStyle = chosen
            ? 'rgba(244,222,177,.6)'
            : 'rgba(159,192,205,.3)'
          ctx.arc(x, y, 14 + Math.sin(t * 4 + i) * 3, 0, Math.PI * 2)
          ctx.stroke()
        }
        ctx.fillStyle = !e.current
          ? 'rgba(140,150,157,.6)'
          : chosen
            ? '#ffe6ac'
            : lit
              ? '#ebd09e'
              : '#9cb0b7'
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fill()
        if (chosen) {
          ctx.strokeStyle = '#f7dba1'
          ctx.beginPath()
          ctx.moveTo(x - 10, y)
          ctx.lineTo(x + 10, y)
          ctx.moveTo(x, y - 10)
          ctx.lineTo(x, y + 10)
          ctx.stroke()
        }
      })
      // A query is a visible input, not an unexplained perpetual particle emitter.
      const qx = width * 0.075,
        qy = height * 0.68
      ctx.strokeStyle = '#cf8864'
      ctx.beginPath()
      ctx.arc(qx, qy, 9, 0, Math.PI * 2)
      ctx.stroke()
      ctx.fillStyle = '#edd6ad'
      ctx.font = 'italic 20px Georgia'
      ctx.fillText('q', qx - 5, qy + 5)
      if (stage >= 2)
        evidence
          .filter((e) => active.has(e.id) && e.current)
          .slice(0, 2)
          .forEach((e) => {
            ctx.strokeStyle = 'rgba(207,136,100,.38)'
            ctx.setLineDash([4, 9])
            ctx.lineDashOffset = quiet ? 0 : -time * 0.015
            ctx.beginPath()
            ctx.moveTo(qx + 11, qy)
            ctx.quadraticCurveTo(
              width * 0.2,
              height * 0.4,
              e.x * width,
              e.y * height,
            )
            ctx.stroke()
            ctx.setLineDash([])
          })
    }
    function tick(time: number) {
      if (time - last > 30) {
        draw(time)
        last = time
      }
      if (visible && !document.hidden && !quiet)
        frame = requestAnimationFrame(tick)
    }
    function start() {
      cancelAnimationFrame(frame)
      draw(performance.now())
      if (visible && !document.hidden && !quiet)
        frame = requestAnimationFrame(tick)
    }
    function resize() {
      if (!canvas || !ctx) return
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      const dpr = Math.min(devicePixelRatio || 1, 1.5)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      start()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      start()
    })
    io.observe(canvas)
    document.addEventListener('visibilitychange', start)
    resize()
    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', start)
    }
  }, [budget, query, quiet, stage])
  return <canvas ref={ref} className="a-constellation" aria-hidden="true" />
}
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
      <div className="a-memory-map">
        <Art name="pigment" className="a-nebula-art" />
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
            onClick={() => inspect(e.id)}
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
        <label className="a-query">
          {w('现在的问题', 'The present question')}
          <select
            value={query}
            onChange={(e) => {
              setQuery(e.target.value as QueryId)
              seq.reset()
            }}
            data-testid="memory-query"
          >
            {(Object.keys(labels) as QueryId[]).map((id) => (
              <option key={id} value={id}>
                {w(...labels[id])}
              </option>
            ))}
          </select>
        </label>
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
