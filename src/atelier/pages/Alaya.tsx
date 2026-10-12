import type { CSSProperties } from 'react'
import { useWords } from '../hooks'
import {
  Art,
  Caption,
  LinkLine,
  Reveal,
  NextProject,
} from '../components/Primitives'
import MemoryScene from '../components/MemoryScene'

export default function Alaya() {
  const w = useWords()
  return (
    <div className="a-alaya a-project-page">
      <header className="a-alaya-hero">
        <Art name="pigment" eager />
        <div className="a-alaya-sky" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <div className="a-alaya-rain" aria-hidden="true">
          {Array.from({ length: 18 }, (_, i) => (
            <i
              key={i}
              style={
                {
                  '--x': `${4 + ((i * 37) % 92)}%`,
                  '--d': `${0.75 + ((i * 7) % 5) * 0.08}s`,
                  '--i': i,
                } as CSSProperties
              }
            />
          ))}
        </div>
        <Caption number="01">AGENT MEMORY / RESEARCH IN PROGRESS</Caption>
        <h1>
          Alaya
          <em>{w('让过去，回应此刻。', 'The past, answering the present.')}</em>
        </h1>
        <p>
          {w(
            '每一次对话都像一场雨，落下，渗进土里。Alaya 是一项关于 Agent 长期记忆的研究与工程实践：雨水如何被留下，涟漪如何彼此相连，过去又如何像星光一样，带着来处回到此刻。',
            'Every conversation falls like rain and soaks into the ground. Alaya is research and engineering for long-term agent memory: how the rain is kept, how its ripples connect, and how the past returns like starlight, carrying where it came from.',
          )}
        </p>
        <div className="a-hero-links">
          <LinkLine to="/alaya#recall">
            {w('进入记忆场', 'Enter the memory field')}
          </LinkLine>
          <LinkLine to="https://github.com/tdwhere123" external>
            GitHub
          </LinkLine>
        </div>
        <span className="a-alaya-margin">
          RAIN — REPRESENTATION
          <br />
          RIPPLE — ASSOCIATION
          <br />
          STARLIGHT — RECALL
        </span>
      </header>
      <section className="a-memory-thesis">
        <Caption>
          {w('问题不只是“记住多少”', 'More than the amount remembered')}
        </Caption>
        <Reveal>
          <h2>
            {w('相似的，', 'Similar')}
            <em>{w('未必就是需要的。', 'is not always useful.')}</em>
          </h2>
        </Reveal>
        <p>
          {w(
            '满天都是星，能替你指路的只有几颗。一段旧决定、一条当前约束、一份来源证据，可能谈论同一个主题，却不应该以相同的方式进入下一轮上下文。',
            'The sky is full of stars; only a few can show the way. An old decision, a current constraint and a source document may describe the same topic, but they should not enter the next context in the same way.',
          )}
        </p>
      </section>
      <section id="recall" className="a-recall-chapter">
        <div className="a-chapter-heading">
          <Caption>THE RECALL STUDY</Caption>
          <h2>
            {w('让一个问题，', 'Watch a question')}
            <br />
            <em>{w('点亮一片过去。', 'illuminate the past.')}</em>
          </h2>
          <p>
            {w(
              '选择问题、逐步推进，或播放整个过程。点亮的星点可查看来源；最后改变预算，看看哪些证据值得留下。',
              'Choose a question, step through, or play the sequence. Inspect a star for its source; change the budget to see which evidence is retained.',
            )}
          </p>
        </div>
        <MemoryScene />
      </section>
      <section className="a-principles">
        <article>
          <span>01</span>
          <small>{w('雨落', 'Rain')}</small>
          <h3>{w('保存的不是答案', 'Store more than answers')}</h3>
          <p>
            {w(
              '雨水落进土里，也带着它落下的地方。信息需要保留它的对象、上下文和出处；写入的形式，决定了之后能如何找到它。',
              'Rain soaks in where it falls. Information needs to keep what it concerns, its context and its source; representation shapes what retrieval can later recover.',
            )}
          </p>
        </article>
        <article>
          <span>02</span>
          <small>{w('涟漪', 'Ripple')}</small>
          <h3>{w('关联不等于采用', 'Connection is not adoption')}</h3>
          <p>
            {w(
              '两圈涟漪会在水面相遇。线索可以扩展候选范围，但候选仍需区分当前有效性、冗余和用途。',
              'Two ripples meet on the water. Connections may broaden the candidate set; candidates still differ in validity, redundancy and purpose.',
            )}
          </p>
        </article>
        <article>
          <span>03</span>
          <small>{w('星光', 'Starlight')}</small>
          <h3>{w('上下文是一种预算', 'Context has a budget')}</h3>
          <p>
            {w(
              '星光很久以前就已发出，此刻才抵达。目标不是把相关项全部塞满，而是在有限空间里，带回互相补充、带着来处的证据。',
              'Starlight left long ago and arrives only now. The aim is not to fill every slot with relevant items, but to return complementary evidence, with its source, within limited space.',
            )}
          </p>
        </article>
      </section>
      <section className="a-boundary-note">
        <Caption>{w('研究与演示的边界', 'Research and demonstration')}</Caption>
        <p>
          {w(
            '这里呈现的是查询、有限范围、关联激活与证据选择的教学化过程。页面使用固定小样例，预算按“证据条数”计，不运行 Alaya 的真实索引、模型或基准，也不把示意动画当作算法效果证明。',
            'This is an educational view of queries, finite scope, associative activation and evidence selection. It uses a fixed fixture and an item-count budget—not the real Alaya index, model, or benchmark. The animation is not evidence of algorithmic performance.',
          )}
        </p>
        <LinkLine to="/blog/agent-memory-governance">
          {w('阅读关于记忆治理的思考', 'Read the memory-governance essay')}
        </LinkLine>
      </section>
      <NextProject
        name="do-it"
        to="/do-it"
        note={w(
          '记得之后，如何可靠地行动？',
          'After remembering, how should an agent act?',
        )}
      />
    </div>
  )
}
