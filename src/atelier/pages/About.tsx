import { useState } from 'react'
import { useWords } from '../hooks'
import { Art, Caption, LinkLine, NextProject } from '../components/Primitives'
export default function About() {
  const w = useWords(),
    [focus, setFocus] = useState(0)
  const thoughts = [
    {
      label: w('为什么', 'Why'),
      text: w(
        '我不太想再给模型加一个漂亮的外壳。我更想弄清楚：当任务持续很久、上下文不断变化，什么能让工作真正继续。',
        'I am less interested in giving a model another polished wrapper than in understanding what lets work continue as tasks grow long and context changes.',
      ),
    },
    {
      label: w('怎么做', 'How'),
      text: w(
        '我主要负责问题定义、架构与研究方向，和 AI agents 一起推进实现。方案不是需要被保护的结论；测试与实验会反过来改变方案。',
        'I focus on problem framing, architecture and research direction, and work with AI agents on implementation. A design is not a conclusion to protect: tests and experiments can change it.',
      ),
    },
    {
      label: w('留什么', 'What remains'),
      text: w(
        '比起一个看上去无所不能的系统，我更在意边界、来源与可检查的结果。仍然没想清楚的部分，也应该诚实留下。',
        'More than an apparently all-capable system, I care about boundaries, sources and checkable results. What remains uncertain should stay visible, too.',
      ),
    },
  ]
  return (
    <div className="a-about">
      <header className="a-about-hero">
        <Art name="landscape" eager intensity="quiet" />
        <Caption>ABOUT / THE PERSON BEHIND THE QUESTIONS</Caption>
        <h1>
          {w('我是阿黄。', 'I am 阿黄.')}
          <em>{w('把问题，做成东西。', 'I make things out of questions.')}</em>
        </h1>
        <span className="a-about-hand" aria-hidden="true">
          still asking.
          <br />
          still making.
        </span>
        <div className="a-about-intro">
          <p>
            {w(
              '我研究 Agent 的记忆与工作方式，也做工具、写手记。Alaya、do-it、Write-Right 是这些问题在不同地方留下的形状。',
              'I study how agents remember and work, build tools, and write notes. Alaya, do-it and Write-Right are different forms those questions have taken.',
            )}
          </p>
          <p>
            {w(
              '对我来说，研究与实现不是两条独立的路。一个想法需要被做出来，才能看清它的边界；做出来的东西，也会带来下一个问题。',
              'Research and implementation are not separate paths for me. Building an idea exposes its limits; what gets built brings the next question.',
            )}
          </p>
        </div>
      </header>
      <section className="a-about-questions">
        <Caption>{w('我反复回到的地方', 'QUESTIONS I RETURN TO')}</Caption>
        <article>
          <span>01</span>
          <h2>{w('过去如何影响现在？', 'How does the past shape now?')}</h2>
          <p>
            {w(
              '什么值得记住，如何表达，又如何在新的问题里被找到。',
              'What deserves to remain, how it is represented, and how it returns in a new question.',
            )}
          </p>
          <LinkLine to="/alaya">Alaya</LinkLine>
        </article>
        <article>
          <span>02</span>
          <h2>{w('怎样才算真的做完？', 'What counts as finished?')}</h2>
          <p>
            {w(
              '意图、改动和验证之间，需要一条可以检查的路径。',
              'Intention, changes and verification need a checkable connection.',
            )}
          </p>
          <LinkLine to="/do-it">do-it</LinkLine>
        </article>
        <article>
          <span>03</span>
          <h2>{w('文字究竟为了什么？', 'What are the words for?')}</h2>
          <p>
            {w(
              '先理解表达的对象与目的，再决定材料如何展开。',
              'Understand the audience and purpose before deciding how the material unfolds.',
            )}
          </p>
          <LinkLine to="/write-right">Write-Right</LinkLine>
        </article>
      </section>
      <section className="a-about-method">
        <div>
          <Caption>WORKING NOTES</Caption>
          <h2>
            {w('方法会变，', 'Methods change.')}
            <br />
            <em>{w('问题继续。', 'The questions continue.')}</em>
          </h2>
        </div>
        <div>
          <div
            className="a-task-choices"
            role="group"
            aria-label={w('工作方式', 'Working method')}
          >
            {thoughts.map((t, i) => (
              <button
                key={t.label}
                aria-pressed={focus === i}
                onClick={() => setFocus(i)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <p aria-live="polite">{thoughts[focus].text}</p>
        </div>
      </section>
      <NextProject
        name="Field notes"
        to="/blog"
        note={w(
          '一些把问题写下来的尝试。',
          'Some attempts to put the questions into words.',
        )}
      />
    </div>
  )
}
