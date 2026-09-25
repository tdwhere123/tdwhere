import { useState, type CSSProperties } from 'react'
import { ArrowRight, RotateCcw, Check } from 'lucide-react'
import { writingNotes, writingOrders, type WritingGoal } from '../model'
import { useWords } from '../hooks'
import { Art, Caption, DemoNote } from './Primitives'
const goals: Record<WritingGoal, [string, string]> = {
  report: ['汇报进展', 'Report progress'],
  request: ['申请支持', 'Request support'],
  invite: ['邀请参与', 'Invite participants'],
}
const headings: Record<WritingGoal, [string, string][]> = {
  report: [
    ['已完成的工作', 'Completed work'],
    ['收集到的反馈', 'Feedback received'],
    ['遇到的限制', 'Constraints'],
    ['下一步计划', 'Next steps'],
  ],
  request: [
    ['需要解决的问题', 'The need'],
    ['已有工作基础', 'Work to date'],
    ['具体申请', 'The request'],
    ['预期改善', 'Expected improvement'],
  ],
  invite: [
    ['时间与邀请', 'The invitation'],
    ['活动安排', 'The setting'],
    ['此前的尝试', 'Earlier sessions'],
    ['你将参与什么', 'What to expect'],
  ],
}
export default function WritingScene() {
  const w = useWords(),
    [goal, setGoal] = useState<WritingGoal>('report'),
    [arranged, setArranged] = useState(false),
    [reviewed, setReviewed] = useState(false)
  const order = writingOrders[goal]
  return (
    <div
      className="a-writing-scene"
      data-testid="atelier-writing"
      data-arranged={arranged}
    >
      <Caption number="03">
        {w(
          '同样的材料，不同的展开',
          'The same material, a different composition',
        )}
      </Caption>
      <div
        className="a-task-choices"
        role="group"
        aria-label={w('写作目的', 'Writing purpose')}
      >
        {(Object.keys(goals) as WritingGoal[]).map((g) => (
          <button
            aria-pressed={g === goal}
            key={g}
            onClick={() => {
              setGoal(g)
              setReviewed(false)
            }}
            data-goal={g}
          >
            {w(...goals[g])}
          </button>
        ))}
      </div>
      <div className="a-paper-table">
        <Art name="manuscript" className="a-manuscript-art" />
        <span className="a-table-script" aria-hidden="true">
          from fragments
          <br />
          to meaning.
        </span>
        <div className="a-paper-spread">
          {writingNotes.map((note, i) => {
            const slot = order.indexOf(i)
            return (
              <article
                className="a-paper-slip"
                key={i}
                style={
                  {
                    '--slot': slot,
                    '--origin': i,
                    '--tilt': `${[-7, 6, -4, 9][i]}deg`,
                  } as CSSProperties
                }
                data-note={i}
                data-slot={slot}
              >
                <small>
                  {arranged
                    ? w(...headings[goal][slot])
                    : `${w('材料', 'Fragment')} 0${i + 1}`}
                </small>
                <p>{w(...note)}</p>
                <span>{arranged ? `0${slot + 1}` : '—'}</span>
              </article>
            )
          })}
        </div>
      </div>
      <div className="a-run-actions">
        <button
          className="a-button"
          onClick={() => {
            setArranged(true)
            setReviewed(false)
          }}
          data-testid="writing-arrange"
        >
          <ArrowRight size={16} />
          {w('组织成提纲', 'Compose the outline')}
        </button>
        <button
          className="a-text-button"
          onClick={() => {
            setArranged(false)
            setReviewed(false)
          }}
        >
          <RotateCcw size={15} />
          {w('打散', 'Scatter')}
        </button>
        <button
          className="a-text-button"
          disabled={!arranged}
          onClick={() => setReviewed(true)}
          data-testid="writing-review"
        >
          <Check size={15} />
          {w('检查缺失信息', 'Check missing information')}
        </button>
      </div>
      <div className="a-writing-result" aria-live="polite">
        {arranged ? (
          <>
            <h4>{w(...goals[goal])}</h4>
            <ol>
              {order.map((id, i) => (
                <li key={id}>
                  <strong>{w(...headings[goal][i])}</strong>
                  <span>{w(...writingNotes[id])}</span>
                </li>
              ))}
            </ol>
            {reviewed && (
              <p className="a-review-warning">
                {w(
                  '仍需补充：具体日期、地点与负责人。材料没有说的，不替它编出来。',
                  'Still needed: the exact date, location and owner. Missing facts should not be invented.',
                )}
              </p>
            )}
          </>
        ) : (
          <p>
            {w(
              '先确定目的，再组织材料。这里不会生成一篇貌似完整、事实却缺失的文章。',
              'Choose the purpose before arranging the material. Missing facts will not be disguised as a finished document.',
            )}
          </p>
        )}
      </div>
      <DemoNote />
    </div>
  )
}
