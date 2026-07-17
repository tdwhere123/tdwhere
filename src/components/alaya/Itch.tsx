import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { motion, useInView } from 'framer-motion'
import { useLang } from '@/context/LangContext'
import { alayaContent } from '@/content/alaya'
import InkReveal from '@/components/InkReveal'
import Kicker from '@/components/Kicker'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const ZEN = [0.22, 1, 0.36, 1] as [number, number, number, number]

/** S2 · The Itch — terminal typewriter + 「Similarity is not truth.」letter pulse. */
export default function Itch() {
  const { lang } = useLang()
  const a = alayaContent[lang].itch
  const sectionRef = useRef<HTMLElement>(null)
  const termRef = useRef<HTMLDivElement>(null)
  const coreRef = useRef<HTMLParagraphElement>(null)
  const termInView = useInView(termRef, { once: true, margin: '-15% 0px' })
  const [typed, setTyped] = useState('')

  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  /* type the `$ exit` line once, 22ms/char */
  useEffect(() => {
    if (!termInView) return undefined
    if (reduced) {
      const id = window.setTimeout(() => setTyped(a.termPrompt), 0)
      return () => window.clearTimeout(id)
    }
    let i = 0
    const id = window.setInterval(() => {
      i += 1
      setTyped(a.termPrompt.slice(0, i))
      if (i >= a.termPrompt.length) window.clearInterval(id)
    }, 22)
    return () => window.clearInterval(id)
  }, [termInView, a.termPrompt, reduced])

  const typedDone = typed === a.termPrompt

  /* core line: letters ink-3 → seal, 2 rounds (0.4s each, stagger 0.02s), then rest at ink */
  useGSAP(
    () => {
      const letters = coreRef.current?.querySelectorAll('[data-letter]')
      if (!letters || letters.length === 0) return
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.set(letters, { color: 'var(--ink)' })
        return
      }
      const tl = gsap.timeline({
        scrollTrigger: { trigger: coreRef.current, start: 'top 75%', once: true },
      })
      const sealQuiet = 'color-mix(in srgb, var(--seal) 68%, var(--ink-3))'
      tl.to(letters, { color: sealQuiet, duration: 0.1, stagger: 0.02 }, 0)
      tl.to(letters, { color: 'var(--ink-3)', duration: 0.1, stagger: 0.02 }, 0.42)
      tl.to(letters, { color: sealQuiet, duration: 0.1, stagger: 0.02 }, 0.84)
      tl.to(letters, { color: 'var(--ink)', duration: 0.15, stagger: 0.02 }, 1.26)
    },
    { scope: sectionRef },
  )

  return (
    <section
      ref={sectionRef}
      className="mx-auto max-w-reading px-5 py-24 text-center md:py-32"
      aria-label={a.kicker}
    >
      <InkReveal amount={0.5}>
        <Kicker className="justify-center">{a.kicker}</Kicker>
      </InkReveal>

      {/* terminal card */}
      <InkReveal amount={0.4} delay={0.1} className="mt-10">
        <div
          ref={termRef}
          className="rounded-[10px] border border-hairline bg-paper-deep px-5 py-4 text-left font-mono text-sm leading-7 text-ink-2"
          role="log"
          aria-live="polite"
          aria-label="terminal"
        >
          <p>
            <span className="text-ink">{typed}</span>
            <span
              aria-hidden="true"
              className={typedDone ? 'opacity-0' : 'animate-caret-blink text-ink-3'}
            >
              ▌
            </span>
            <motion.span
              initial={false}
              animate={{ opacity: typedDone ? 1 : 0 }}
              transition={{ duration: 0.4, ease: ZEN }}
              className="ml-4 text-faint"
            >
              {a.termC1}
            </motion.span>
          </p>
          <motion.p
            initial={false}
            animate={{ opacity: typedDone ? 1 : 0, y: typedDone ? 0 : 6 }}
            transition={{ duration: 0.5, ease: ZEN, delay: 0.35 }}
            className="pl-[4.5ch] text-faint"
          >
            {a.termC2}
          </motion.p>
        </div>
      </InkReveal>

      {/* big statement */}
      <InkReveal amount={0.3} className="mt-14">
        <p
          className="font-serif font-semibold text-ink"
          style={{ fontSize: 'clamp(26px, 4.4vw, 40px)', lineHeight: 1.3 }}
        >
          {a.big}
        </p>
      </InkReveal>

      {/* core line */}
      <p
        ref={coreRef}
        className="mt-10 font-mono text-base tracking-[0.08em] md:text-lg"
        aria-label={a.core}
      >
        {Array.from(a.core).map((ch, i) => (
          <span key={i} data-letter aria-hidden="true" style={{ color: 'var(--ink-3)' }}>
            {ch === ' ' ? ' ' : ch}
          </span>
        ))}
      </p>
    </section>
  )
}
