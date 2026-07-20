import { motion } from 'framer-motion'
import type { MouseEvent } from 'react'
import { useLang } from '@/context/LangContext'
import { doItContent } from '@/content/doIt'
import Kicker from '@/components/Kicker'
import MetaChip from '@/components/MetaChip'
import GateOpen from '@/components/doit/GateOpen'
import { getLenis } from '@/lib/smooth-scroll'

const ZEN = [0.22, 1, 0.36, 1] as [number, number, number, number]
const BACK = [0.34, 1.56, 0.64, 1] as [number, number, number, number]

/** S1 · do-it project hero — gate open + char-level ink reveal for the title. */
export default function DoItHero() {
  const { lang } = useLang()
  const c = doItContent[lang].hero

  const scrollToRouter = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    const el = document.getElementById('router')
    if (!el) return
    const lenis = getLenis()
    if (lenis) lenis.scrollTo(el, { offset: -72 })
    else el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative mx-auto max-w-shell px-5 pb-20 pt-14 md:px-10 md:pb-28 md:pt-20">
      <GateOpen lineClassName="bg-museum-brass/40">
        <div className="flex items-start justify-between gap-8">
          <div className="max-w-reading">
            <motion.div
              initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.8, ease: ZEN, delay: 0.35 }}
            >
              <Kicker>{c.kicker}</Kicker>
            </motion.div>

            {/* title — char-level ink reveal (5 chars, stagger 0.03s) */}
            <h1
              className="mt-6 font-serif font-semibold lowercase leading-[1.05] text-museum-ink"
              style={{ fontSize: 'clamp(48px, 8vw, 84px)' }}
              aria-label={c.title}
            >
              {c.title.split('').map((ch, i) => (
                <motion.span
                  key={`${ch}-${i}`}
                  aria-hidden="true"
                  className="inline-block"
                  initial={{ y: 40, opacity: 0, filter: 'blur(8px)' }}
                  animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                  transition={{ duration: 0.9, ease: ZEN, delay: 0.55 + i * 0.03 }}
                >
                  {ch}
                </motion.span>
              ))}
            </h1>

            <motion.p
              className="mt-3 text-base text-ink-3 md:text-lg"
              initial={{ y: 32, opacity: 0, filter: 'blur(6px)' }}
              animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.8, ease: ZEN, delay: 0.8 }}
            >
              {c.subtitle}
            </motion.p>

            <motion.blockquote
              className="mt-8"
              initial={{ y: 32, opacity: 0, filter: 'blur(6px)' }}
              animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.8, ease: ZEN, delay: 0.9 }}
            >
              <p
                className="font-serif italic text-ink-2"
                style={{ fontSize: 'clamp(20px, 2.6vw, 28px)', lineHeight: 1.4 }}
              >
                {c.slogan}
              </p>
              <p className="mt-3 font-serif text-ink-3">{c.sloganAlt}</p>
            </motion.blockquote>

            <motion.div
              className="mt-8 flex flex-wrap gap-2"
              initial={{ y: 32, opacity: 0, filter: 'blur(6px)' }}
              animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.8, ease: ZEN, delay: 1.0 }}
            >
              {c.chips.map((chip) => (
                <MetaChip key={chip}>{chip}</MetaChip>
              ))}
            </motion.div>

            {/* host badges — stagger pop-in */}
            <div className="mt-6 flex flex-wrap gap-2" aria-label="hosts">
              {c.hosts.map((host, i) => (
                <motion.span
                  key={host}
                  className="inline-flex items-center rounded-[4px] border border-museum-brass/35 bg-museum-stone px-2.5 py-1 font-mono text-[11px] tracking-wide text-ink-2"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.45, ease: BACK, delay: 1.15 + i * 0.06 }}
                >
                  {host}
                </motion.span>
              ))}
            </div>

            <motion.div
              className="mt-10 flex flex-wrap items-center gap-6"
              initial={{ y: 32, opacity: 0, filter: 'blur(6px)' }}
              animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.8, ease: ZEN, delay: 1.3 }}
            >
              <motion.a
                href={c.repoUrl}
                target="_blank"
                rel="noreferrer"
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center rounded-md border border-museum-ink px-5 py-2.5 font-mono text-sm text-museum-ink transition-colors duration-300 hover:border-clay hover:text-clay"
              >
                {c.ctaRepo}
              </motion.a>
              <a
                href="#router"
                onClick={scrollToRouter}
                className="group relative font-mono text-sm text-ink-3 transition-colors duration-300 hover:text-ink"
              >
                {c.ctaTry}
                <span
                  aria-hidden="true"
                  className="absolute -bottom-0.5 left-0 h-px w-0 bg-ink transition-all duration-300 ease-zen group-hover:w-full"
                />
              </a>
            </motion.div>
          </div>

          {/* vertical decoration */}
          <motion.span
            aria-hidden="true"
            className="vertical-rl hidden shrink-0 select-none font-serif text-lg text-museum-brass/45 md:block"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, ease: ZEN, delay: 1.4 }}
          >
            {c.vertical}
          </motion.span>
        </div>
      </GateOpen>
    </section>
  )
}
