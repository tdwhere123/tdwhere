import { useState } from 'react'
import { useWords } from '../hooks'
import { Art, LinkLine, NextProject } from '../components/Primitives'
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
        <div className="a-about-plate">
          <Art name="landscape" eager />
        </div>
        <h1 data-rise>{w('我是阿黄', 'I’m 阿黄')}</h1>
        <p className="a-about-lead" data-fade="0.3">{w('一个独立探索者。', 'An independent explorer.')}</p>
        <div className="a-about-intro" data-fade="0.45">
          <p>
            {w(
              '我在探索 AI agent 如何长期可靠地工作：它记住什么、怎么判断，以及做完的事能不能被检查。Alaya 和 do-it 是这些问题做成的东西。',
              'I explore how AI agents can work reliably over long stretches: what they remember, how they judge, and whether finished work can be checked. Alaya and do-it are what those questions turned into.',
            )}
          </p>
          <p>
            {w(
              '对我来说，研究和实现是同一件事。一个想法要做出来，才看得清它的边界；做出来的东西，又会带来下一个问题。工作之外，我拍胶片，写手记。',
              'For me, research and building are the same work. An idea has to be built before its limits show, and what gets built brings the next question. Outside of that, I shoot film and write notes.',
            )}
          </p>
        </div>
      </header>
      <section className="a-about-questions">
        <p className="a-about-label">{w('我在想的两个问题', 'Two questions I keep working on')}</p>
        <article data-fade>
          <h2>{w('过去如何影响现在？', 'How does the past shape the present?')}</h2>
          <p>
            {w(
              '什么值得记住，怎样记下来，又怎样在新的问题里被找回。',
              'What deserves to be kept, how to write it down, and how it is found again in a new question.',
            )}
          </p>
          <LinkLine to="/alaya">Alaya</LinkLine>
        </article>
        <article data-fade="0.1">
          <h2>{w('怎样才算真的做完？', 'What counts as actually finished?')}</h2>
          <p>
            {w(
              '意图、改动和验证之间，需要一条可以检查的路。',
              'Between the intention, the change and the check, there has to be a path someone can follow.',
            )}
          </p>
          <LinkLine to="/do-it">do-it</LinkLine>
        </article>
      </section>
      <section className="a-about-method">
        <div>
          <p className="a-about-label">{w('我怎么工作', 'How I work')}</p>
          <h2 data-rise>{w('三件我在意的事', 'Three things I hold to')}</h2>
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
        name={w('手记', 'Notes')}
        to="/blog"
        note={w('关于 AI、记忆和学习方法的文章，也有几篇小说。', 'Essays on AI, memory and how I learn, and a few stories.')}
      />
    </div>
  )
}
