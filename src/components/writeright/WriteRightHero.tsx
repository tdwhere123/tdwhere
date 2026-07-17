import { motion } from 'framer-motion'
import type { MouseEvent } from 'react'
import { useLang } from '@/context/LangContext'
import { writeRightContent } from '@/content/writeRight'
import Kicker from '@/components/Kicker'
import MetaChip from '@/components/MetaChip'
import Stamp from '@/components/Stamp'
import GateOpen from '@/components/doit/GateOpen'
import { getLenis } from '@/lib/smooth-scroll'

const ZEN = [0.22, 1, 0.36, 1] as [number, number, number, number]
const BACK = [0.34, 1.56, 0.64, 1] as [number, number, number, number]

/* cool slate metal grid — dai identity on museum paper */
const GRID_BG = `linear-gradient(color-mix(in srgb, var(--dai) 9%, transparent) 1px, transparent 1px),
linear-gradient(90deg, color-mix(in srgb, var(--dai) 9%, transparent) 1px, transparent 1px)`

/** S1 · Write-Right project hero — gate open, faint manuscript grid, WIP stamp. */
export default function WriteRightHero() {
  const { lang } = useLang()
  const c = writeRightContent[lang].hero

  const scrollToRouter = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    const el = document.getElementById('genre-router')
    if (!el) return
    const lenis = getLenis()
    if (lenis) lenis.scrollTo(el, { offset: -72 })
    else el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative overflow-hidden">
      {/* faint manuscript grid (田字格), fading in from center */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: ZEN, delay: 0.5 }}
        style={{
          backgroundImage: GRID_BG,
          backgroundSize: '42px 42px',
          maskImage: 'radial-gradient(ellipse 90% 80% at 50% 42%, black 30%, transparent 100%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 90% 80% at 50% 42%, black 30%, transparent 100%)',
        }}
      />

      <div className="relative mx-auto max-w-shell px-5 pb-20 pt-14 md:px-10 md:pb-28 md:pt-20">
        <GateOpen>
          <div className="flex items-start justify-between gap-8">
            <div className="max-w-reading">
              <motion.div
                initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.8, ease: ZEN, delay: 0.35 }}
              >
                <Kicker>{c.kicker}</Kicker>
              </motion.div>

              <motion.h1
                className="mt-6 font-serif font-semibold leading-[1.08] text-ink"
                style={{ fontSize: 'clamp(44px, 7vw, 76px)' }}
                initial={{ y: 40, opacity: 0, filter: 'blur(8px)' }}
                animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                transition={{ duration: 0.9, ease: ZEN, delay: 0.55 }}
              >
                {c.title}
              </motion.h1>

              <motion.p
                className="mt-3 text-base text-ink-3 md:text-lg"
                initial={{ y: 32, opacity: 0, filter: 'blur(6px)' }}
                animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                transition={{ duration: 0.8, ease: ZEN, delay: 0.75 }}
              >
                {c.subtitle}
              </motion.p>

              <motion.p
                className="mt-8 font-serif font-semibold text-ink-2"
                style={{ fontSize: 'clamp(20px, 2.6vw, 28px)', lineHeight: 1.5 }}
                initial={{ y: 32, opacity: 0, filter: 'blur(6px)' }}
                animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                transition={{ duration: 0.8, ease: ZEN, delay: 0.9 }}
              >
                {c.slogan}
              </motion.p>

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

              <div className="mt-6 flex flex-wrap gap-2" aria-label="hosts">
                {c.hosts.map((host, i) => (
                  <motion.span
                    key={host}
                    className="inline-flex items-center rounded-[4px] border border-museum-line bg-paper px-2.5 py-1 font-mono text-[11px] tracking-wide text-ink-3"
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
                  className="inline-flex items-center rounded-md border border-ink px-5 py-2.5 font-mono text-sm text-ink transition-colors duration-300 hover:border-dai hover:text-dai"
                >
                  {c.ctaRepo}
                </motion.a>
                <a
                  href="#genre-router"
                  onClick={scrollToRouter}
                  className="group relative font-mono text-sm text-ink-3 transition-colors duration-300 hover:text-ink"
                >
                  {c.ctaTry}
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-0.5 left-0 h-px w-0 bg-museum-brass transition-all duration-300 ease-zen group-hover:w-full"
                  />
                </a>
              </motion.div>
            </div>

            {/* right column: WIP stamp + vertical decoration */}
            <div className="hidden shrink-0 flex-col items-end gap-10 md:flex">
              <Stamp text={c.stamp} className="mt-2" />
              <motion.span
                aria-hidden="true"
                className="vertical-rl select-none font-serif text-lg text-faint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.2, ease: ZEN, delay: 1.4 }}
              >
                {c.vertical}
              </motion.span>
            </div>
          </div>
        </GateOpen>
      </div>
    </section>
  )
}
