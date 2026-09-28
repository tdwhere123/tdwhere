import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowUpRight } from 'lucide-react'
import { useWords } from '../hooks'
import { HeroInscription } from '../components/HeroInscription'
import { Art, Caption, LinkLine, Reveal } from '../components/Primitives'
import MemoryScene from '../components/MemoryScene'
import { centerOf, paint, sweep } from '../paint/bus'
import { studyGlazes } from '../paint/presets'

export default function Home() {
  const w = useWords(),
    [study, setStudy] = useState(0)
  useEffect(() => {
    paint('home', { type: 'glaze', color: studyGlazes[study] })
  }, [study])
  return (
    <div className="a-home">
      <section className="a-home-hero" data-study={study}>
        <Art eager channel="home" className="a-hero-landscape" />
        <div className="a-hero-orbits" aria-hidden="true">
          <i />
          <i />
          <i />
          <b>q</b>
          <span>m</span>
        </div>
        <div className="a-hero-copy">
          <Caption>
            阿黄 / tdwhere — {w('研究与造物', 'Research & making')}
          </Caption>
          <h1>
            {w('让记忆，', 'A longer memory.')}
            <br />
            <em>{w('成为下一步。', 'A further step.')}</em>
          </h1>
          <p>
            {w(
              '我研究 Agent 的记忆与工作方式，尝试把长期的上下文、可靠的过程和人的意图，接在一起。',
              'I study and build agent memory and working methods—connecting long-term context, dependable process and human intention.',
            )}
          </p>
          <LinkLine to="/#work">
            {w('走进这些项目', 'Explore the work')}
          </LinkLine>
        </div>
        <div className="a-hero-sidenote">
          <span>
            FIELD NOTES
            <br />
            ON A LONGER
            <br />
            TOMORROW
          </span>
          <span className="a-small-cross" aria-hidden="true">
            +
          </span>
        </div>
        <HeroInscription
          index={study}
          onAdvance={(from) => {
            setStudy((study + 1) % studyGlazes.length)
            const at = centerOf(from)
            if (at) paint('home', { type: 'pulse', ...at, radius: 0.11, amount: 0.85 })
          }}
        />
        <div className="a-hero-signature" aria-hidden="true">
          a longer <em>tomorrow.</em>
        </div>
        <a className="a-scroll-note" href="#work">
          <ArrowDown size={17} />
          {w('向下探索', 'Scroll to explore')}
        </a>
      </section>
      <section id="work" className="a-opening-statement">
        <Caption number="00">{w('一个共同的问题', 'One shared question')}</Caption>
        <Reveal>
          <h2>
            {w('一次回答很容易。', 'An answer is easy.')}
            <br />
            <em>{w('把事情做完，很难。', 'Finishing the work is not.')}</em>
          </h2>
        </Reveal>
        <div className="a-opening-body">
          <p>
            {w(
              '把一件事做完，需要记得之前发生过什么，按可靠的步骤推进，最后交出一个经得起检查的结果。我的项目分别从这三处入手。',
              'Finishing takes remembering what came before, moving through dependable steps, and handing over a result that holds up to checking. Each project starts from one of these.',
            )}
          </p>
          <ul className="a-opening-threads">
            <li>
              <Link to="/alaya">
                <span>{w('记得', 'Remember')}</span>
                <em>Alaya</em>
              </Link>
            </li>
            <li>
              <Link to="/do-it">
                <span>{w('做完', 'Carry through')}</span>
                <em>do-it</em>
              </Link>
            </li>
            <li>
              <Link to="/write-right">
                <span>{w('说清', 'Say it clearly')}</span>
                <em>Write-Right</em>
              </Link>
            </li>
          </ul>
        </div>
      </section>
      <section className="a-home-memory">
        <div className="a-project-intro">
          <Caption number="01">AGENT MEMORY</Caption>
          <h2>
            Alaya
            <span>{w('过去，并未离场。', 'The past is still present.')}</span>
          </h2>
          <div>
            <p>
              {w(
                '研究记忆的表达、关联与召回。不是把所有历史搬回来，而是让当前的问题，找到有根据的过去。',
                'A study of memory representation, association and recall. Not all of history—just the past that can support the present question.',
              )}
            </p>
            <LinkLine to="/alaya">{w('走进 Alaya', 'Inside Alaya')}</LinkLine>
          </div>
        </div>
        <MemoryScene compact />
      </section>
      <section className="a-home-making">
        <Reveal
          className="a-work-construction"
          onPointerEnter={(e) => {
            const art = e.currentTarget.querySelector('.a-art')
            sweep('home-doit', art, 0.62)
            sweep('home-doit', art, 0.78, 0.15, 0.85)
          }}
        >
          <Art name="construction" channel="home-doit" />
          <Caption number="02">AGENT WORKFLOW</Caption>
          <h2>
            <Link to="/do-it">
              do-it
              <ArrowUpRight />
            </Link>
          </h2>
          <h3>{w('让工作，走得通。', 'Make the work hold up.')}</h3>
          <p>
            {w(
              '从任务判断到审查验证，为编码 Agent 建立可复用的工作方式。',
              'Reusable working methods for coding agents, from task assessment to review and verification.',
            )}
          </p>
          <LinkLine to="/do-it">
            {w('看一次任务如何完成', 'Follow a task')}
          </LinkLine>
        </Reveal>
        <Reveal
          className="a-work-writing"
          onPointerEnter={(e) => {
            const art = e.currentTarget.querySelector('.a-art')
            ;[0.3, 0.5, 0.7].forEach((fy, i) =>
              setTimeout(() => {
                const at = centerOf(art, 0.55 + i * 0.1, fy)
                if (at) paint('home-writing', { type: 'pulse', ...at, radius: 0.05, amount: 0.9 })
              }, i * 180),
            )
          }}
        >
          <Art name="manuscript" channel="home-writing" />
          <Caption number="03">WRITING & CONTEXT</Caption>
          <h2>
            <Link to="/write-right">
              Write-Right
              <ArrowUpRight />
            </Link>
          </h2>
          <h3>{w('表达，也需要来处。', 'Give expression a foundation.')}</h3>
          <p>
            {w(
              '从自己的材料、文种和目的出发，把中文正式写作组织成可检查的过程。',
              'A reviewable approach to formal Chinese writing, grounded in your material, genre and purpose.',
            )}
          </p>
          <LinkLine to="/write-right">
            {w('把材料排成一篇文章', 'Compose the material')}
          </LinkLine>
        </Reveal>
      </section>
      <section className="a-home-notes">
        <div>
          <Caption number="04">{w('思想的侧面', 'In the margins')}</Caption>
          <h2>
            Field
            <br />
            <em>notes.</em>
          </h2>
          <p>
            {w(
              '一些问题没有结论，先把思考留下来。',
              'Some questions are not settled. Keep the thinking, too.',
            )}
          </p>
        </div>
        <div className="a-home-note-list">
          <Link to="/blog/memory-is-not-one-thing">
            <time>2026.08.07</time>
            <h3>关于 AI Memory，我们如何理解？（三）</h3>
            <ArrowUpRight size={20} />
          </Link>
          <Link to="/blog/know-what-we-want">
            <time>2026.07.10</time>
            <h3>我是如何学习 AI 的？（二）</h3>
            <ArrowUpRight size={20} />
          </Link>
          <Link to="/blog/learn-ai-by-building">
            <time>2026.06.08</time>
            <h3>我是如何学习 AI 的？（一）</h3>
            <ArrowUpRight size={20} />
          </Link>
          <LinkLine to="/blog">{w('全部手记', 'All notes')}</LinkLine>
        </div>
      </section>
      <section className="a-home-afterword">
        <span className="a-handwritten">still becoming.</span>
        <p>
          {w(
            '还有一些更早、更小、未完成的尝试。',
            'There are earlier, smaller, unfinished experiments, too.',
          )}
        </p>
        <LinkLine to="/playground">SENTINEL & Vegetarian-card</LinkLine>
      </section>
    </div>
  )
}
