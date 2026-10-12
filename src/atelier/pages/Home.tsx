import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { ArrowDown, ArrowUpRight } from 'lucide-react'
import { useWords } from '../hooks'
import { Art, Caption, LinkLine } from '../components/Primitives'
import Wash from '../components/Wash'
import { centerOf, paint } from '../paint/bus'
import { sceneAt } from '../model'
import type { ShellContext } from '../shell/Shell'

const notes = [
  ['/blog/memory-is-not-one-thing', '2026.08.07', '关于 AI Memory，我们如何理解？（三）'],
  ['/blog/know-what-we-want', '2026.07.10', '我是如何学习 AI 的？（二）'],
  ['/blog/learn-ai-by-building', '2026.06.08', '我是如何学习 AI 的？（一）'],
]
/** Layer of the pond series each chapter stands in: rain, rain, night, dawn, day, dusk. */
const scenes = [0, 0, 1, 2, 3, 4]
const hours: [string, string][] = [
  ['开篇', 'Opening'],
  ['问题', 'Question'],
  ['Alaya', 'Alaya'],
  ['do-it', 'do-it'],
  ['手记', 'Notes'],
  ['别处', 'Elsewhere'],
]

/**
 * One pond, held still. The page never appears to scroll: the scroll track
 * only turns the chapters over in place and changes the hour of the painting
 * behind them. Each scroll gesture snaps to the next chapter.
 */
export default function Home() {
  const w = useWords(),
    { setTone } = useOutletContext<ShellContext>()
  const root = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const go = (i: number) => {
    const el = root.current,
      snap = el?.querySelectorAll<HTMLElement>('.a-snap')[i]
    if (!el || !snap) return
    const quiet = matchMedia('(prefers-reduced-motion: reduce)').matches
    scrollTo({ top: scrollY + snap.getBoundingClientRect().top, behavior: quiet ? 'auto' : 'smooth' })
  }
  useEffect(() => {
    const el = root.current
    if (!el) return
    const html = document.documentElement
    html.classList.add('a-snapping')
    const chapters = [...el.querySelectorAll<HTMLElement>('.a-chapter')],
      snaps = [...el.querySelectorAll<HTMLElement>('.a-snap')]
    const quiet = matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0,
      lastAt = -1,
      travelled = 0,
      lastDrag = 0
    const update = () => {
      raf = 0
      const page = snaps[0]?.offsetHeight || innerHeight
      const at = Math.min(chapters.length - 1, Math.max(0, -el.getBoundingClientRect().top / page))
      chapters.forEach((c, i) => {
        const d = at - i,
          far = Math.abs(d)
        const o = Math.max(0, 1 - far * 1.4),
          shown = o * o * (3 - 2 * o)
        c.style.opacity = String(shown)
        c.style.visibility = shown < 0.01 ? 'hidden' : ''
        if (!quiet) {
          c.style.transform = `translate3d(0, ${(-d * 56).toFixed(1)}px, 0)`
          c.style.filter = far > 0.02 ? `blur(${Math.min(10, far * 14).toFixed(1)}px)` : ''
        }
        c.toggleAttribute('data-active', Math.round(at) === i)
      })
      setActive(Math.round(at))
      const scene = sceneAt(
        scenes.map((s, i) => ({ center: i, scene: s })),
        at,
      )
      paint('home', { type: 'scene', at: scene })
      setTone(scene > 0.5 && scene < 1.5 ? 'night' : 'paper')
      if (lastAt >= 0) travelled += at - lastAt
      lastAt = at
      const now = performance.now()
      if (Math.abs(travelled) > 0.12 && now - lastDrag > 260) {
        const dir = Math.sign(travelled),
          y = innerHeight * (0.3 + Math.random() * 0.6),
          x = innerWidth * (0.1 + Math.random() * 0.5),
          span = innerWidth * (0.16 + Math.random() * 0.12)
        paint('home', {
          type: 'drag',
          x0: dir > 0 ? x : x + span,
          y0: y,
          x1: dir > 0 ? x + span : x,
          y1: y + innerHeight * 0.03 * dir,
        })
        travelled = 0
        lastDrag = now
      }
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    // keyboard focus inside a resting chapter brings that chapter forward
    const onFocus = (e: FocusEvent) => {
      const i = chapters.findIndex((c) => c.contains(e.target as Node))
      if (i >= 0 && !chapters[i].hasAttribute('data-active'))
        scrollTo({ top: scrollY + snaps[i].getBoundingClientRect().top })
    }
    update()
    addEventListener('scroll', schedule, { passive: true })
    addEventListener('resize', schedule)
    el.addEventListener('focusin', onFocus)
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('scroll', schedule)
      removeEventListener('resize', schedule)
      el.removeEventListener('focusin', onFocus)
      html.classList.remove('a-snapping')
      setTone(null)
    }
  }, [setTone])
  const ripple = (e: PointerEvent<HTMLElement>) => {
    const at = centerOf(e.currentTarget)
    if (at) paint('home', { type: 'pulse', ...at, radius: 0.09, amount: 0.7 })
  }
  return (
    <div className="a-home" ref={root}>
      <div className="a-stage">
        <Art name="pond" eager channel="home" className="a-stage-art" />
        <div className="a-stage-veil" aria-hidden="true" />

        <section className="a-chapter a-chapter-open">
          <div className="a-chapter-copy">
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
          </div>
          <button type="button" className="a-scroll-cue" onClick={() => go(1)}>
            <ArrowDown size={17} aria-hidden="true" />
            {w('向下，天色会变', 'Scroll, and the light changes')}
          </button>
        </section>

        <section className="a-chapter a-chapter-question">
          <div className="a-chapter-copy">
            <Caption number="00">{w('一个共同的问题', 'One shared question')}</Caption>
            <h2>
              {w('一次回答很容易。', 'An answer is easy.')}
              <br />
              <em>{w('把事情做完，很难。', 'Finishing the work is not.')}</em>
            </h2>
            <p>
              {w(
                '把一件事做完，需要记得之前发生过什么，再按可靠的步骤推进，交出一个经得起检查的结果。我的两个项目，分别从这两处入手。',
                'Finishing takes remembering what came before, then moving through dependable steps to a result that holds up to checking. Each of my two projects starts from one of these.',
              )}
            </p>
            <ul className="a-threads">
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
            </ul>
          </div>
        </section>

        <section className="a-chapter a-chapter-night">
          <div className="a-chapter-copy">
            <Caption number="01">AGENT MEMORY</Caption>
            <h2 className="a-chapter-name">Alaya</h2>
            <h3>{w('雨停之后，才看得见星星。', 'After the rain, the stars.')}</h3>
            <p>
              {w(
                '每一次对话都像一场雨，落下，渗进土里。Alaya 研究这些雨水如何被留下、彼此关联，又在需要的时候，像星光一样，带着来处回到此刻。',
                'Every conversation falls like rain and soaks into the ground. Alaya studies how that rain is kept, how it connects, and how—like starlight—it returns to the present carrying where it came from.',
              )}
            </p>
            <LinkLine to="/alaya">{w('走进 Alaya', 'Inside Alaya')}</LinkLine>
          </div>
        </section>

        <section className="a-chapter a-chapter-dawn">
          <div className="a-chapter-copy">
            <Caption number="02">AGENT WORKFLOW</Caption>
            <h2 className="a-chapter-name">
              <Link to="/do-it">
                do-it
                <ArrowUpRight aria-hidden="true" />
              </Link>
            </h2>
            <h3>{w('天亮了，事情要做完。', 'Morning. The work has to hold up.')}</h3>
            <p>
              {w(
                '从任务判断到审查验证，为编码 Agent 建立可复用的工作方式。每一步都留下可以检查的依据。',
                'Reusable working methods for coding agents, from task assessment to review and verification—every step leaves evidence you can check.',
              )}
            </p>
            <LinkLine to="/do-it">{w('看一次任务如何完成', 'Follow a task')}</LinkLine>
          </div>
        </section>

        <section className="a-chapter a-chapter-day">
          <div className="a-chapter-copy a-notes-panel">
            <Wash />
            <Caption number="03">{w('思想的侧面', 'In the margins')}</Caption>
            <h2>
              Field <em>notes.</em>
            </h2>
            <p>
              {w(
                '一些问题没有结论，先把思考留下来。',
                'Some questions are not settled. Keep the thinking, too.',
              )}
            </p>
            <div className="a-note-list">
              {notes.map(([to, date, title]) => (
                <Link key={to} to={to}>
                  <time>{date}</time>
                  <span>{title}</span>
                  <ArrowUpRight size={18} aria-hidden="true" />
                </Link>
              ))}
            </div>
            <LinkLine to="/blog">{w('全部手记', 'All notes')}</LinkLine>
          </div>
        </section>

        <section className="a-chapter a-chapter-elsewhere">
          <div className="a-chapter-copy">
            <Caption number="04">ELSEWHERE / OPEN ENDS</Caption>
            <h2 className="a-chapter-name">
              Else<em>where.</em>
            </h2>
            <span className="a-handwritten" aria-hidden="true">
              still becoming.
            </span>
            <p>
              {w(
                '天黑之前，还有一些更早、更小、没做完的尝试。它们没有长成项目，但有些问题，正是从那里开始的。',
                'Before dark, there are earlier, smaller, unfinished experiments. They never became projects, but some questions began right there.',
              )}
            </p>
          </div>
          <div className="a-postcards">
            <Link to="/playground#sentinel" className="a-postcard is-sentinel" onPointerEnter={ripple}>
              <small>01 · {w('叙事游戏', 'Narrative game')}</small>
              <strong>SENTINEL</strong>
              <em>{w('一段尚未结束的对话。', 'An unfinished conversation.')}</em>
              <span>{w('终端还醒着，可以开机。', 'The terminal is still awake.')}</span>
              <i aria-hidden="true">RUINS 遗址</i>
            </Link>
            <Link to="/playground#veggie" className="a-postcard is-veggie" onPointerEnter={ripple}>
              <small>02 · {w('产品尝试', 'Product sketch')}</small>
              <strong>Vegetarian-card</strong>
              <em>{w('从一张素食卡片开始。', 'It began with a recipe card.')}</em>
              <span>{w('卡片还摆在桌上。', 'The cards are still on the table.')}</span>
              <i aria-hidden="true">EARLY 初稿</i>
            </Link>
          </div>
        </section>

        <nav className="a-hours" aria-label={w('首页章节', 'Home chapters')}>
          {hours.map(([zh, en], i) => (
            <button
              key={en}
              type="button"
              aria-current={active === i ? 'step' : undefined}
              onClick={() => go(i)}
            >
              <span>{w(zh, en)}</span>
            </button>
          ))}
        </nav>
      </div>
      {scenes.map((_, i) => (
        <div key={i} className="a-snap" id={i === 1 ? 'work' : undefined} aria-hidden="true" />
      ))}
    </div>
  )
}
