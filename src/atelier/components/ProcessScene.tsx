import { useState } from 'react'
import { ArrowRight, RotateCcw, Check, AlertTriangle } from 'lucide-react'
import { workflow, advanceRun, emptyRun, type TaskKind } from '../model'
import { useWords } from '../hooks'
import { Art, Caption, DemoNote } from './Primitives'
const stageNames: Record<string, [string, string]> = {
  scope: ['辨认任务', 'Scope'],
  plan: ['形成方案', 'Plan'],
  challenge: ['挑战假设', 'Challenge'],
  edit: ['实施修改', 'Implement'],
  review: ['检查改动', 'Review'],
  verify: ['验证证据', 'Verify'],
  deliver: ['交付结果', 'Deliver'],
}
const stageNotes: Record<string, [string, string]> = {
  scope: [
    '先辨认任务的影响面。不同工作不需要同样重的流程。',
    'Assess the impact first. Not every task needs the same amount of process.',
  ],
  plan: [
    '先确定边界与验证方式，再把任务交给执行者。',
    'Define the boundary and the verification method before implementation.',
  ],
  challenge: [
    '高影响改动先检查隐含假设，不把第一个方案当作结论。',
    'Challenge assumptions in high-impact work; the first proposal is not the conclusion.',
  ],
  edit: [
    '实现只覆盖已确定的范围，保留可检查的改动。',
    'Implement the agreed scope and keep the change reviewable.',
  ],
  review: [
    '把实际改动与任务要求对照，而不是只相信完成声明。',
    'Compare the actual change to the request, not just a completion claim.',
  ],
  verify: [
    '演示中故意留有一个失败条件。修正后必须再次验证。',
    'This example contains an intentional failure. Repair it, then verify again.',
  ],
  deliver: [
    '这份样例已经通过检查，交付附带验证记录。',
    'The example now passes; delivery includes its verification record.',
  ],
}
export default function ProcessScene() {
  const w = useWords(),
    [kind, setKind] = useState<TaskKind>('api'),
    [run, setRun] = useState(emptyRun)
  const path = workflow[kind],
    current = path[run.index]
  const tasks: Record<TaskKind, [string, string]> = {
    copy: ['修正文案', 'Correct copy'],
    api: ['增加 API 分页', 'Add API pagination'],
    auth: ['迁移鉴权方式', 'Migrate authentication'],
  }
  const x = 10 + (run.index / (path.length - 1)) * 80
  return (
    <div
      className="a-process-scene"
      data-testid="atelier-process"
      data-failed={run.failed}
      data-current={current}
    >
      <Caption number="02">
        {w('工作如何穿过不确定性', 'A task moves through uncertainty')}
      </Caption>
      <div
        className="a-task-choices"
        role="group"
        aria-label={w('选择任务', 'Choose a task')}
      >
        {(Object.keys(tasks) as TaskKind[]).map((k) => (
          <button
            key={k}
            aria-pressed={kind === k}
            onClick={() => {
              setKind(k)
              setRun(emptyRun())
            }}
            data-task={k}
          >
            {w(...tasks[k])}
          </button>
        ))}
      </div>
      <div className="a-scaffold">
        <Art name="construction" className="a-construction-art" />
        <svg
          viewBox="0 0 1000 340"
          preserveAspectRatio="none"
          className="a-scaffold-lines"
          aria-hidden="true"
        >
          <path d="M65 225H935M100 230L120 290H880L900 230M85 193H915" />
          {path.map((s, i) => {
            const px = 100 + (i * 800) / (path.length - 1)
            return (
              <g key={s}>
                <path
                  d={`M${px} 145V297M${px - 10} 297h20M${px} 240l55 50M${px} 240l-55 50`}
                />
                <circle
                  cx={px}
                  cy={193}
                  r={8}
                  className={i <= run.index ? 'is-traversed' : ''}
                />
              </g>
            )
          })}
          <path
            className="a-task-path"
            d="M100 193H900"
            pathLength="100"
            style={{
              strokeDasharray: `${(run.index / (path.length - 1)) * 100} 100`,
            }}
          />
        </svg>
        <div className="a-task-packet" style={{ left: `${x}%` }}>
          <span>{run.failed ? '!' : current === 'deliver' ? '✓' : 't'}</span>
        </div>
        <div className="a-scaffold-labels">
          {path.map((s, i) => (
            <div
              key={s}
              className={i === run.index ? 'is-current' : ''}
              style={{ left: `${10 + (i * 80) / (path.length - 1)}%` }}
            >
              <small>0{i + 1}</small>
              <strong>{w(...stageNames[s])}</strong>
            </div>
          ))}
        </div>
      </div>
      <div className="a-run-log" role="status" aria-live="polite">
        <span className="a-micro">
          {run.failed
            ? 'CHECK FAILED'
            : current === 'deliver'
              ? 'EXAMPLE VERIFIED'
              : `STEP 0${run.index + 1}`}
        </span>
        <p>
          {run.failed
            ? w(
                '检查未通过：样例缺少回归条件。交付被阻止。',
                'Check failed: the fixture is missing a regression condition. Delivery is blocked.',
              )
            : w(...stageNotes[current])}
        </p>
      </div>
      <div className="a-run-actions">
        {run.failed ? (
          <button
            className="a-button"
            onClick={() => setRun((s) => advanceRun(kind, s, 'repair'))}
            data-testid="process-repair"
          >
            <AlertTriangle size={16} />
            {w('补齐样例条件', 'Repair the example')}
          </button>
        ) : (
          <button
            className="a-button"
            disabled={current === 'deliver'}
            onClick={() => setRun((s) => advanceRun(kind, s, 'next'))}
            data-testid="process-next"
          >
            {current === 'deliver' ? (
              <Check size={16} />
            ) : (
              <ArrowRight size={16} />
            )}
            {current === 'deliver'
              ? w('已交付样例', 'Example delivered')
              : current === 'verify'
                ? w('运行样例检查', 'Check the example')
                : w('推进一步', 'Advance one step')}
          </button>
        )}
        <button
          className="a-text-button"
          onClick={() => setRun(emptyRun())}
          aria-label={w('重置任务', 'Reset task')}
        >
          <RotateCcw size={15} />
          {w('重来', 'Reset')}
        </button>
        <p>
          {w(
            '示意路径会随任务变化，不是对产品固定流水线的承诺。',
            'The route varies by task; this is not a claim of a fixed production pipeline.',
          )}
        </p>
      </div>
      <DemoNote />
    </div>
  )
}
