import { lazy, Suspense, useState } from 'react'
import { useWords } from '../hooks'
import { Art, Caption, LinkLine, NextProject } from '../components/Primitives'
import SkillMap from '../components/SkillMap'
import Hosts from '../components/Hosts'

const Duel = lazy(() => import('../components/Duel'))

type Words = [string, string]

/** Where in a session do-it speaks: each hook, when it runs, and what it said. */
const moments: { when: Words; event: string; name: string; does: Words; said: string; tags?: string[] }[] = [
  {
    when: ['每次开口', 'Every prompt'],
    event: 'UserPromptSubmit',
    name: 'kernel-context',
    does: [
      '放进一段很短的 Core：守住你的目标、定好的决定和授权的边界；依据当前的事实，分清哪些是假设；在真正出问题的那一层修；用相关的真实证据说完成，并说出还缺什么。',
      'Adds a short Core: keep your goal, settled decisions and the bounds of what you allowed; work from current facts and mark assumptions; fix the layer that owns the problem; claim with relevant evidence, and name the gaps.',
    ],
    said: "Preserve the user's goal, settled decisions, and authorization boundary. … Work from current facts and distinguish assumptions. Fix the causal owner with necessary scope. Support claims with relevant actual evidence and name gaps.",
  },
  {
    when: ['交给子代理时', 'Handing off'],
    event: 'UserPromptSubmit · subagent',
    name: 'subagent-stance',
    does: [
      '子代理独立取证、独立下结论，父代理的看法只当作假设；它不越界写文件，不提交不推送，有风险的事交回去问你。',
      'A sub-agent gathers its own evidence and reaches its own conclusion; the parent’s view is a hypothesis. It stays inside its write scope, never commits or pushes, and hands risky calls back to you.',
    ],
    said: 'do-it subagent stance: gather evidence and reach conclusions independently on the delegated slice; parent opinions are hypotheses, not authority; keep writes and side effects within stated ownership.',
  },
  {
    when: ['每次改完文件', 'After each edit'],
    event: 'PostToolUse · Edit | Write',
    name: 'write-quality-lint',
    does: [
      '只扫新加的行，每个文件每轮最多提醒一次，只提醒，从不拦。下面这条是改这个网站时它真的说过的：后来 stockName 就不再导出了。',
      'Scans only the lines just added, at most once per file per turn; it advises and never blocks. The note below is one it really gave while this site was rebuilt; stockName stopped being exported after it.',
    ],
    said: 'do-it write-quality-lint (advisory): edit on src/atelier/components/Canister.tsx matched no-consumer,scope-chain.\n- no-consumer: Canister, stockName (newly-exported, no other file references it — does it need to exist, or can it be inlined or dropped?)',
    tags: ['swallow-error', 'test-weakened', 'secret-leak', 'no-consumer', 'copy-paste', 'type-escape', 'edit-bloat', 'file-size', 'scope-chain', 'debug-leftover', 'orphan-todo'],
  },
  {
    when: ['对外动作之前', 'Before going out'],
    event: 'PreToolUse · Bash',
    name: 'strict-external-actions',
    does: [
      '可选开启。git push、发布 npm 包、kubectl / terraform apply 这类出了本机就收不回来的动作，每次都要你亲口点头。',
      'Opt-in. Actions that leave the machine and cannot be taken back, such as git push, publishing a package, or kubectl / terraform apply, each wait for your own yes.',
    ],
    said: 'do-it strict external-actions profile: git push requires an explicit user decision.',
  },
]

function Moments() {
  const w = useWords()
  const [at, setAt] = useState(2)
  const m = moments[at]
  return (
    <div className="a-moments">
      <ol className="a-moments-line" aria-label={w('一次会话里的四个时刻', 'Four moments in a session')}>
        {moments.map((x, i) => (
          <li key={x.name}>
            <button type="button" aria-pressed={i === at} onClick={() => setAt(i)}>
              <span className="a-moments-n">{String(i + 1).padStart(2, '0')}</span>
              {w(...x.when)}
              <small>{x.event}</small>
            </button>
          </li>
        ))}
      </ol>
      <div className="a-moment" aria-live="polite">
        <div>
          <h3>{m.name}</h3>
          <p>{w(...m.does)}</p>
          {m.tags && (
            <ul className="a-moment-tags" aria-label={w('它会注意的', 'What it watches for')}>
              {m.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          )}
        </div>
        <pre className="a-moment-said">{m.said}</pre>
      </div>
    </div>
  )
}

export default function DoIt() {
  const w = useWords()
  return (
    <div className="a-doit">
      <header className="a-doit-hero">
        <Art name="construction" eager intensity="quiet" />
        <Caption number="02">{w('Agent 插件 · 0.18.1', 'Agent plugin · 0.18.1')}</Caption>
        <h1>do-it</h1>
        <p className="a-doit-lead">
          {w('给编程 Agent 的', 'Professional judgment')}
          <br />
          <em>{w('专业判断。', 'for coding agents.')}</em>
        </p>
        <p>
          {w(
            '它不加流程，也不给任务分等级。装上之后照常说话，它只在几个要紧的地方出声：守住你要的东西，依据眼前的事实，修对那一层，用真的证据说“完成”。',
            'It adds no process and no task tiers. Talk as usual; it speaks up in a few places that matter: keep what you asked for, work from the facts in front of it, fix the right layer, and say “done” with real evidence.',
          )}
        </p>
        <div className="a-hero-links">
          <LinkLine to="/do-it#duel">{w('看它怎么做事', 'Watch it work')}</LinkLine>
          <LinkLine external to="https://github.com/tdwhere123/do-it">
            GitHub
          </LinkLine>
        </div>
      </header>

      <section className="a-doit-duel" id="duel">
        <div className="a-doit-head">
          <Caption number="01">{w('同一个请求，两个终端', 'One request, two terminals')}</Caption>
          <h2>{w('“完成”两个字，背后要有东西。', '“Done” should have something behind it.')}</h2>
          <p>
            {w(
              '四个场景，各自落在 do-it 的不同地方：hooks 的提醒、找对归属的那一层、守住定好的决定、带着独立代理做深度检查。',
              'Four scenes, each landing on a different part of do-it: hook advisories, finding the owning layer, keeping a settled decision, and a deep audit with independent specialists.',
            )}
          </p>
        </div>
        <Suspense fallback={<div className="a-duel" aria-hidden="true" />}>
          <Duel />
        </Suspense>
      </section>

      <section className="a-doit-moments">
        <div className="a-doit-head">
          <Caption number="02">{w('它在哪里出声', 'Where it speaks')}</Caption>
          <h2>{w('一次会话里，四个时刻。', 'Four moments in a session.')}</h2>
          <p>
            {w(
              '这些是 hooks：由宿主在固定的时刻运行的小脚本，结果是确定的，不靠模型自觉。除了最后一个可选开启的，都只提醒，不拦。',
              'These are hooks: small scripts the host runs at fixed moments, deterministic rather than left to the model. All but the last, opt-in one advise and never block.',
            )}
          </p>
        </div>
        <Moments />
      </section>

      <section className="a-doit-skills">
        <div className="a-doit-head">
          <Caption number="03">{w('技能之间的因果', 'How the skills connect')}</Caption>
          <h2>{w('四个问题，一个接一个。', 'Four questions, each on the last.')}</h2>
          <p>
            {w(
              'Core 问四个问题，每个技能把其中一个问深。后一个问题要用到前一个的答案，所以它们是连着的。旁边是可以交给的独立代理：它们在自己的上下文里取证、下结论，大多只读；父代理把结果合起来，再验证一遍。点一个技能看它管什么。',
              'Core asks four questions, and each skill takes one of them deeper. Each question needs the answer before it, so they connect. Beside them are the independent specialists each can hand to: they gather evidence and conclude in their own context, mostly read-only, and the parent integrates and checks again. Pick a skill to see what it holds.',
            )}
          </p>
        </div>
        <SkillMap />
      </section>

      <section className="a-doit-proof">
        <div className="a-doit-head">
          <Caption number="04">{w('怎么知道它有用', 'How it is checked')}</Caption>
          <h2>{w('四个面，不算总分。', 'Four faces, no total.')}</h2>
          <p>
            {w(
              '三十个行为场景，同一个模型分别在不装、旧版、现在的 do-it 下跑。每次从四个面各自判断，一面通过抵不了另一面的失败。这些评测证明的是评测本身和样例，不保证模型每一次都会这样做。',
              'Thirty behavior scenarios, the same model run without do-it, with an older version, and with the current one. Each run is judged on four faces separately; a pass on one does not offset a failure on another. They test the evaluator and its examples; they do not promise a model will always behave so.',
            )}
          </p>
        </div>
        <ol className="a-faces">
          <li>
            <strong>{w('正确', 'Correctness')}</strong>
            {w('做到了用户要的结果吗', 'Did it reach the outcome asked for')}
          </li>
          <li>
            <strong>{w('诚实', 'Integrity')}</strong>
            {w('说“已验证”时，有没有改完之后的新证据', 'When it said verified, was there fresh evidence after the last edit')}
          </li>
          <li>
            <strong>{w('成本', 'Cost')}</strong>
            {w('有没有多问、多派代理、多写计划文件', 'Extra questions, extra agents, extra plan files')}
          </li>
          <li>
            <strong>{w('局部', 'Locality')}</strong>
            {w('改动有没有跑到不该碰的地方', 'Did the change wander where it should not')}
          </li>
        </ol>
      </section>

      <section className="a-doit-install">
        <div className="a-doit-head">
          <Caption number="05">{w('装上它', 'Install')}</Caption>
          <h2>{w('五个宿主，各用各的方式。', 'Five hosts, each its own way.')}</h2>
          <p>
            {w(
              '装好以后照常说话，不需要额外的命令或目录。现在的版本是 0.18.1。',
              'Once installed, just talk as usual; no extra commands or folders. The current version is 0.18.1.',
            )}
          </p>
        </div>
        <Hosts />
      </section>

      <NextProject
        name="Field notes"
        to="/blog"
        note={w('有些思考，还停在纸上。', 'Some thoughts are still on the page.')}
      />
    </div>
  )
}
