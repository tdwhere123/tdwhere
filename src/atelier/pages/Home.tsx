import { useEffect, useRef, type CSSProperties, type FocusEvent, type PointerEvent, type SyntheticEvent } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { ArrowDown, ArrowUpRight } from 'lucide-react'
import { useQuiet, useWords } from '../hooks'
import { centerOf, paint } from '../paint/bus'
import { Art } from '../components/Primitives'
import { projects } from '../projects'
import { EASE, T, gsap, ScrollTrigger } from '../motion'
import { useOpened } from '../shell/opening'
import type { ShellContext } from '../shell/Shell'

const more = [
  { to: '/film', name: ['胶片', 'Film'], line: ['用胶片拍下的东西，一卷一卷放在这里。', 'What I shoot on film, one roll at a time.'] },
  { to: '/blog', name: ['手记', 'Notes'], line: ['关于 AI、记忆和学习方法的文章，也有几篇小说。', 'Essays on AI, memory and how I learn, and a few stories.'] },
  { to: '/about', name: ['关于', 'About'], line: ['我是谁，怎么工作。', 'Who I am and how I work.'] },
] as const

/**
 * The person first, over the sea (shell/HomeFrame.tsx): the name is written on, then one plain
 * line about the work. Scrolling sinks under the surface, where the projects come up one at a
 * time; below them, the other ways in. Leaving lets the tide take the painting away.
 */
export default function Home() {
  const quiet = useQuiet()
  const opened = useOpened()
  const w = useWords(),
    { setTone } = useOutletContext<ShellContext>()
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    setTone('night')
    return () => setTone(null)
  }, [setTone])
  useEffect(() => () => paint('home', { type: 'depth', value: 0 }), [])
  // after the opening (or at once, when there was none): the name, then the line, then the rest
  useEffect(() => {
    const el = root.current
    if (!opened || !el) return
    el.dataset.in = ''
    if (quiet) return
    const ctx = gsap.context(() => {
      gsap.from('.a-home-lead, .a-home-sub', { yPercent: 40, autoAlpha: 0, duration: T.slow, ease: EASE, stagger: 0.12, delay: 0.9 })
      gsap.from('.a-home-plate, .a-home-cue', { autoAlpha: 0, duration: T.base, ease: EASE, delay: 1.5 })
      // the hero thins out as the page sinks
      gsap.to('.a-home-hero-inner', {
        yPercent: -14,
        autoAlpha: 0,
        ease: 'none',
        scrollTrigger: { trigger: '.a-home-hero', start: 'top top', end: 'bottom 20%', scrub: true },
      })
      const dive = el.querySelector<HTMLElement>('.a-dive')!
      ScrollTrigger.create({
        trigger: dive,
        start: 'top bottom',
        end: 'bottom bottom',
        onUpdate: (self) => paint('home', { type: 'depth', value: Math.min(1, self.progress * 1.5) }),
        onLeave: () => paint('home', { type: 'depth', value: 1 }),
        onLeaveBack: () => paint('home', { type: 'depth', value: 0 }),
      })
      const plates = gsap.utils.toArray<HTMLElement>('.a-plate', el)
      const ticks = gsap.utils.toArray<HTMLElement>('.a-dive-ticks i', el)
      const tl = gsap.timeline({ scrollTrigger: { trigger: dive, start: 'top top', end: 'bottom bottom', scrub: 0.8 } })
      plates.forEach((plate, i) => {
        const art = plate.querySelector('.a-plate-art'),
          words = plate.querySelectorAll('.a-plate-text > *')
        tl.fromTo(plate, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, i ? '>' : 0)
          .fromTo(art, { yPercent: 18, scale: 1.08, clipPath: 'inset(30% 0% 30% 0%)' }, { yPercent: 0, scale: 1, clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: 'power2.out' }, '<')
          .fromTo(words, { y: 60, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.08, ease: 'power2.out' }, '<0.15')
          .to(ticks[i], { '--tick': 1, duration: 0.6 }, '<')
          .to({}, { duration: 0.9 })
        if (i < plates.length - 1)
          tl.to(art, { yPercent: -16, autoAlpha: 0, duration: 0.8, ease: 'power2.in' })
            .to(words, { y: -50, autoAlpha: 0, duration: 0.6, stagger: 0.04, ease: 'power2.in' }, '<')
            .set(plate, { autoAlpha: 0 })
      })
    }, el)
    return () => ctx.revert()
  }, [opened, quiet])
  const ripple = (e: SyntheticEvent<HTMLElement>) => {
    if (quiet) return
    const at = centerOf(e.currentTarget)
    if (at) paint('home', { type: 'pulse', ...at, radius: 0.06, amount: 0.4 })
  }
  const stir = {
    onPointerEnter: (e: PointerEvent<HTMLElement>) => { if (e.pointerType === 'mouse') ripple(e) },
    onFocus: (e: FocusEvent<HTMLElement>) => { if (e.currentTarget.matches(':focus-visible')) ripple(e) },
  }
  const shown = projects.slice(0, 3)
  return (
    <div className="a-home" ref={root} data-still={quiet ? '' : undefined}>
      <section className="a-home-hero">
        <div className="a-home-hero-inner">
          <h1 className="a-signature">
            <span className="a-sig-cn" aria-label="阿黄">
              {['阿', '黄'].map((c, i) => (
                <span key={c} className="a-sig-char" style={{ '--i': i } as CSSProperties} aria-hidden="true">{c}</span>
              ))}
            </span>
            <span className="a-sig-en">tdwhere</span>
          </h1>
          <p className="a-home-lead">{w('我是阿黄，一个独立探索者。', 'I’m 阿黄, an independent explorer.')}</p>
          <p className="a-home-sub">
            {w(
              '我在探索 AI agent 如何长期可靠地工作：记忆、判断，和可以检查的结果。也拍胶片，写手记。',
              'I explore how AI agents can work reliably over long stretches: memory, judgment, and results you can check. I also shoot film and write notes.',
            )}
          </p>
        </div>
        <p className="a-home-plate">{w('朱家尖，舟山 · 2023 年 11 月 · Kodak Gold，重画', 'Zhujiajian, Zhoushan · Nov 2023 · Kodak Gold, repainted')}</p>
        <span className="a-home-cue" aria-hidden="true">
          {w('向下', 'Scroll')}
          <ArrowDown size={14} />
        </span>
      </section>
      <section className="a-dive" aria-label={w('正在做', 'Current work')}>
        <div className="a-dive-stage">
          <p className="a-dive-label">{w('正在做', 'Current work')}</p>
          <div className="a-dive-ticks" aria-hidden="true">
            {shown.map((p) => <i key={p.to} />)}
          </div>
          {shown.map((p) => (
            <article className="a-plate" key={p.to}>
              <Link to={p.to} className="a-plate-art" tabIndex={-1} aria-hidden="true">
                {'image' in p ? <img className="a-art" src={p.image} alt="" draggable={false} /> : <Art name={p.art} still eager={opened} />}
              </Link>
              <div className="a-plate-text">
                <span className="a-plate-kind">{w(...p.kind)}</span>
                <h2>{p.name}</h2>
                <p>{w(...p.line)}</p>
                <Link to={p.to} className="a-plate-link" {...stir}>
                  <span className="a-flip" data-text={w(`进入 ${p.name}`, `Open ${p.name}`)}>
                    <span>{w(`进入 ${p.name}`, `Open ${p.name}`)}</span>
                  </span>
                  <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="a-home-more">
        <nav aria-label={w('其他入口', 'More')}>
          {more.map((m) => (
            <Link key={m.to} to={m.to} {...stir} data-fade>
              <strong>{w(m.name[0], m.name[1])}</strong>
              <span>{w(m.line[0], m.line[1])}</span>
              <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          ))}
        </nav>
      </section>
    </div>
  )
}
