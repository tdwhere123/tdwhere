import { useState } from 'react'
import { ArrowDown, ArrowRight } from 'lucide-react'
import { useWords } from '../hooks'

type Words = [string, string]
type Column = 'want' | 'where' | 'right' | 'claim'

/**
 * do-it's skills laid out by the questions Core asks, in the order their
 * answers depend on each other. Not a pipeline: a small change may touch only
 * the last question. Wording follows the skills' own SKILL.md files.
 */
const columns: { id: Column; q: Words; ask: Words; skills: string[]; agents: string[] }[] = [
  {
    id: 'want',
    q: ['要什么', 'What must hold'],
    ask: ['这次改动之后，哪些结果和决定必须还在？', 'What outcome and decisions must survive this change?'],
    skills: ['decide'],
    agents: ['product-strategist', 'plan-challenger'],
  },
  {
    id: 'where',
    q: ['改在哪', 'Where it belongs'],
    ask: ['这个行为属于哪里，哪些使用方要跟着变？', 'Where does the behavior belong, and which consumers must change with it?'],
    skills: ['code-quality', 'architecture'],
    agents: ['code-mapper', 'architecture-strategist'],
  },
  {
    id: 'right',
    q: ['对不对', 'Is it right'],
    ask: ['满足要求了吗？本身站得住吗？两个问题分开问。', 'Does it meet the ask? Does it hold up? Asked apart.'],
    skills: ['review'],
    agents: ['reviewer', 'spec-compliance-reviewer', 'code-quality-cleaner', 'red-team-reviewer'],
  },
  {
    id: 'claim',
    q: ['能说完成吗', 'Can it be claimed'],
    ask: ['现有的证据证明了什么，还有什么不知道？', 'What does the evidence establish, and what is still unknown?'],
    skills: ['verify'],
    agents: ['tdd-red-writer'],
  },
]

/** Why each question waits on the one before it. */
const because: Words[] = [
  ['知道要什么，才找得到该改的那一层', 'Knowing what must hold is how you find the layer to change'],
  ['Spec 对照第一问，Standards 检查第二问', 'Spec checks the first question; Standards, the second'],
  ['问题修完，结论要靠修完之后的新证据', 'Once fixed, the claim rests on evidence from after the fix'],
]

const skills: Record<string, { when: Words; key: Words; touches: Column[] }> = {
  core: {
    when: ['每次都在：仓库里的工作需要一条共同的底线。', 'Always present: repository work needs a shared baseline.'],
    key: [
      '守住你的目标、定好的决定和授权的边界；依据当前的事实，分清假设；在必要的范围里修真正的归属层；用相关的真实证据支持结论，并说出缺口。不规定步骤。',
      'Keep your goal, settled decisions and the bounds of what you allowed; work from current facts and mark assumptions; fix the causal owner with the scope it needs; support claims with relevant evidence and name gaps. No prescribed phases.',
    ],
    touches: ['want', 'where', 'right', 'claim'],
  },
  decide: {
    when: [
      '对一个选择、计划、依赖或交接的不确定，可能实质改变要做的东西时。',
      'When uncertainty about a choice, plan, dependency or handoff could change what gets built.',
    ],
    key: [
      '找出能改变结果的那个不确定，用证据解决它：读仓库、查资料、做个小实验、问你，或者独立分析。定好的决定不重开，除非新证据推翻了它的前提。能读到的事实，不拿来问你。',
      'Find the uncertainty that can change the outcome and settle it with evidence: the repository, a reference, a small experiment, your decision, or independent analysis. Settled decisions stay settled unless new evidence breaks their basis. Facts it can read are not turned into questions for you.',
    ],
    touches: ['want'],
  },
  'code-quality': {
    when: [
      '设计、修改、调试代码，需要找到问题真正归属的那一层时。',
      'When designing, changing or debugging code needs the layer that truly owns the problem.',
    ],
    key: [
      '顺着实际行为找到最早出错的地方，和这个含义的主人。症状出现在界面、缓存或适配层，不代表规则该放在那里。改动 API 或边界时，生产方和使用方都要找到。',
      'Follow the live behavior to the earliest divergence and the owner of its meaning. A symptom at the UI, cache or adapter does not make that layer the home of the rule. When an API or boundary changes, find both its producers and its consumers.',
    ],
    touches: ['where'],
  },
  architecture: {
    when: [
      '权威、归属、契约、依赖边界、迁移、恢复或删除结构可能改变设计时。',
      'When authority, ownership, contracts, boundaries, migration, recovery or deletion can change a design.',
    ],
    key: [
      '分清含义的权威、准入、派生的视图和恢复。缓存和副本不能悄悄变成第二个权威。加一层抽象、服务或治理之前，先问它是不是必要的。',
      'Tell apart semantic authority, admission, derived projections and recovery. Caches and copies must not quietly become a second authority. Before adding an abstraction, service or layer, ask whether it is needed.',
    ],
    touches: ['where'],
  },
  review: {
    when: [
      '要分别判断需求是否满足、实现质量如何，或一次处理一批审查意见时。',
      'When requirements and implementation quality need judging apart, or a batch of findings needs resolving.',
    ],
    key: [
      'Spec 问它是否满足你的要求、决定、边界和验收；Standards 问它的归属、契约、失败行为和可维护性。一边通过，抵不了另一边的失败。共享同一个根的问题，先收齐再一起修。',
      'Spec asks whether it meets your requirements, decisions, bounds and acceptance; Standards asks about ownership, contracts, failure behavior and maintainability. A pass on one does not close a failure on the other. Findings that share a root are gathered before the root is fixed.',
    ],
    touches: ['right', 'want', 'where'],
  },
  verify: {
    when: [
      '为“完成”、回归修复、安装或分支收尾挑选证据时。',
      'When choosing evidence for “done”, a regression fix, an installation or a branch closeout.',
    ],
    key: [
      '让证据对上结论。一条命令通过，只证明它真正检查了的东西；先确认这条检查在行为缺失时会失败。修 bug 要复现原来的症状。缺证据就说 NOT_VERIFIED，并说清缺什么。',
      'Match evidence to the claim. A passing command proves only what it checked; make sure the check would fail without the behavior. A bug fix reproduces the original symptom. Missing proof is NOT_VERIFIED, with what is missing.',
    ],
    touches: ['claim'],
  },
  audit: {
    when: [
      '你明确要求对整个仓库或某个范围做深度检查时；普通的 review 不会变成它。',
      'When you explicitly ask for a deep audit of the repository or a scope; an ordinary review never becomes one.',
    ],
    key: [
      '先画出分层、权威和端到端链路，按文件、层、链三个维度算覆盖。多角度检查之后，由新的独立上下文做因果综合，然后才提修复。默认只读。',
      'Map the layers, authorities and end-to-end chains first, and count coverage by file, layer and chain. After the multi-angle review, a fresh independent context does the causal synthesis; only then come repairs. Read-only by default.',
    ],
    touches: ['want', 'where', 'right', 'claim'],
  },
  retrospective: {
    when: ['你要求回看一次合作或工程结果时。', 'When you ask to look back at a collaboration or an outcome.'],
    key: [
      '从真实发生的事推理：本想要什么，实际发生了什么，哪个原因最能解释差别。原因出在技能本身时，先把这次经过写成可复现的场景，再去改。',
      'Reason from what happened: what was intended, what occurred, which cause best explains the gap. When the cause is a skill itself, the episode becomes a reproducible scenario before the skill is changed.',
    ],
    touches: ['claim'],
  },
  context: {
    when: [
      '术语、关系或不变量在你的说法、文档和实现之间对不上，或者同样的知识总被重新发现时。',
      'When terms, relationships or invariants drift between your words, the docs and the code, or the same knowledge keeps being rediscovered.',
    ],
    key: [
      '用当前的代码、项目说明和你的本意解决含糊的名字和冲突的事实。只在能避免反复困惑时才写下来，优先放进项目已有的文档。',
      'Settle ambiguous names and conflicting facts against current code, project instructions and what you mean. Write down only what prevents repeated confusion, in the project’s existing docs first.',
    ],
    touches: ['want'],
  },
  'skill-authoring': {
    when: ['写或改 do-it 自己的技能时。', 'When writing or revising a do-it skill.'],
    key: [
      '从一次观察到的失败出发，不从想象的需要出发。先写成行为场景，和旧版、或者没有这个技能时对比；两边都通过的场景，证明不了技能有用。',
      'Start from an observed failure, not an imagined need. Capture it as a behavior scenario and compare against the current skill, or none; a scenario that passes either way shows nothing.',
    ],
    touches: [],
  },
}

/** Skills that sit outside the four questions: on demand, and keeping the work. */
const around: { name: string; note: Words }[] = [
  { name: 'audit', note: ['你点名时，四个问题在整个仓库上一起深查', 'Named by you: all four questions, across a repository'] },
  { name: 'retrospective', note: ['结果出来以后，回看差在哪里', 'After the outcome: where the gap came from'] },
  { name: 'skill-authoring', note: ['回看找到的原因，写成场景，再改技能', 'A cause found looking back becomes a scenario, then a revision'] },
  { name: 'context', note: ['反复被重新发现的知识，留进项目文档', 'Knowledge rediscovered again and again, kept in the project’s docs'] },
]

function Skill({ name, picked, pick }: { name: string; picked: string; pick: (name: string) => void }) {
  return (
    <button type="button" className="a-map-skill" aria-pressed={picked === name} onClick={() => pick(name)}>
      do-it-{name}
    </button>
  )
}

export default function SkillMap() {
  const w = useWords()
  const [picked, setPicked] = useState('verify')
  const skill = skills[picked]
  const lit = (c: Column) => (skill.touches.includes(c) ? '' : undefined)
  return (
    <div className="a-map">
      <div className="a-map-core" data-lit={picked === 'core' || picked === 'audit' ? '' : undefined}>
        <Skill name="core" picked={picked} pick={setPicked} />
        <p>
          {w(
            '每一问都先过它：哪个事实能改变我的结论？查过没有？',
            'Every question passes through it first: which fact could change my conclusion, and have I checked it?',
          )}
        </p>
      </div>
      <ol className="a-map-columns">
        {columns.map((col, i) => (
          <li key={col.id} data-lit={lit(col.id)}>
            <span className="a-map-n">{String(i + 1).padStart(2, '0')}</span>
            <h3>{w(...col.q)}</h3>
            <p className="a-map-ask">{w(...col.ask)}</p>
            <div className="a-map-skills">
              {col.skills.map((name) => (
                <Skill key={name} name={name} picked={picked} pick={setPicked} />
              ))}
            </div>
            <ul className="a-map-agents" aria-label={w('可以交给', 'Can hand to')}>
              {col.agents.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
            {because[i] && (
              <p className="a-map-because">
                <ArrowRight className="a-map-wide" size={14} aria-hidden="true" />
                <ArrowDown className="a-map-narrow" size={14} aria-hidden="true" />
                {w(...because[i])}
              </p>
            )}
          </li>
        ))}
      </ol>
      <ul className="a-map-around">
        {around.map(({ name, note }) => (
          <li key={name}>
            <Skill name={name} picked={picked} pick={setPicked} />
            <span>{w(...note)}</span>
          </li>
        ))}
      </ul>
      <div className="a-map-detail" aria-live="polite" key={picked}>
        <h3>do-it-{picked}</h3>
        <p className="a-map-when">{w(...skill.when)}</p>
        <p>{w(...skill.key)}</p>
      </div>
      <p className="a-map-note">
        {w(
          '这是因果，不是流水线：后一个问题要用到前一个的答案，但小改动可能只走到最后一问。技能按任务挑，也可以点名用。',
          'Cause, not conveyor belt: each question uses the answer before it, but a small change may only need the last one. Skills are picked to fit the task, or named by you.',
        )}
      </p>
    </div>
  )
}
