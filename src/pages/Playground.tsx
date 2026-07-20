import { motion } from 'framer-motion'
import { useLang } from '@/context/LangContext'
import { playground } from '@/content/playground'
import Kicker from '@/components/Kicker'
import InkReveal from '@/components/InkReveal'
import GateDivider from '@/components/GateDivider'
import NextProject from '@/components/NextProject'
import SentinelTerminal from '@/components/playground/SentinelTerminal'
import VegetarianCards from '@/components/playground/VegetarianCards'
import { asset } from '@/lib/asset'

/** 「」 corner brackets scale in at character level, then the quote settles. */
function QuoteLine({ text, delay }: { text: string; delay: number }) {
  const bracketAnim = {
    initial: { scale: 1.4, opacity: 0 },
    whileInView: { scale: 1, opacity: 1 },
    viewport: { once: true, amount: 0.6 },
    transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }
  return (
    <blockquote className="font-serif text-h3 font-semibold leading-relaxed text-ink-2">
      <motion.span {...bracketAnim} className="inline-block text-museum-brass">
        「
      </motion.span>
      {text}
      <motion.span
        {...bracketAnim}
        transition={{ ...bracketAnim.transition, delay: delay + 0.08 }}
        className="inline-block text-museum-brass"
      >
        」
      </motion.span>
    </blockquote>
  )
}

export default function Playground() {
  const { lang } = useLang()
  const t = playground[lang]

  return (
    <>
      {/* Museum gallery wall — limestone room; CRT stays a dark object inside */}
      <div className="pg-gallery relative isolate overflow-hidden">
        <style>{`
          .pg-gallery {
            --pg-muted: color-mix(in srgb, var(--museum-muted) 88%, var(--museum-ink));
            --pg-line: color-mix(in srgb, var(--museum-brass) 32%, var(--museum-line));
            color: var(--museum-ink);
            background-color: var(--museum-bg);
            background-image:
              radial-gradient(
                ellipse 70% 50% at 50% 12%,
                color-mix(in srgb, var(--museum-stone) 55%, transparent),
                transparent 65%
              ),
              radial-gradient(
                ellipse 42% 36% at 82% 70%,
                color-mix(in srgb, var(--museum-brass) 8%, transparent),
                transparent 70%
              ),
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 55px,
                color-mix(in srgb, var(--museum-line) 22%, transparent) 55px,
                color-mix(in srgb, var(--museum-line) 22%, transparent) 56px
              ),
              url("${asset('paper-grain.png')}");
            background-size: auto, auto, auto, 280px 280px;
            background-blend-mode: normal, normal, normal, soft-light;
          }
          .pg-gallery .pg-gate > span:first-of-type {
            background: var(--pg-line);
          }
          .pg-gallery .pg-gate > span:last-of-type {
            background: var(--museum-bg);
            border-color: var(--pg-line);
          }
        `}</style>

        {/* S1 · header */}
        <header className="mx-auto max-w-shell px-5 pb-20 pt-[clamp(64px,10vh,112px)] md:px-10">
          <InkReveal>
            <Kicker>{t.header.kicker}</Kicker>
          </InkReveal>
          <InkReveal delay={0.1}>
            <h1 className="mt-6 font-serif text-h1 font-bold text-museum-ink">
              {t.header.title}
              <span className="ml-4 align-middle font-mono text-sm font-normal uppercase tracking-[0.14em] text-museum-muted">
                {t.header.titleEn}
              </span>
            </h1>
          </InkReveal>
          <InkReveal delay={0.2}>
            <p className="mt-6 max-w-reading text-base leading-[1.85] text-museum-muted md:text-[17px]">
              {t.header.intro}
            </p>
          </InkReveal>
        </header>

        {/* S2 · SENTINEL — dark CRT as object in a light gallery */}
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-shell px-3 md:px-6"
        >
          <SentinelTerminal />
        </motion.div>

        <GateDivider className="pg-gate mx-auto mt-[clamp(96px,15vh,168px)] max-w-shell px-5 md:px-10" />

        {/* S3 · vegetarian drawer */}
        <VegetarianCards />

        {/* S4 · a note on ruins */}
        <section className="mx-auto max-w-reading px-5 pb-[clamp(96px,15vh,168px)] md:px-10">
          <InkReveal>
            <Kicker>{t.ruins.kicker}</Kicker>
          </InkReveal>
          <InkReveal delay={0.1}>
            <div
              className="mt-8 space-y-8 rounded-[4px] border px-7 py-10 md:px-10"
              style={{
                borderColor: 'color-mix(in srgb, var(--museum-brass) 36%, transparent)',
                background:
                  'linear-gradient(165deg, color-mix(in srgb, var(--museum-stone) 70%, white) 0%, var(--museum-stone) 100%)',
                boxShadow:
                  '0 1px 0 color-mix(in srgb, white 35%, transparent)',
              }}
            >
              {t.ruins.quotes.map((q, i) => (
                <QuoteLine key={q} text={q} delay={0.15 + i * 0.15} />
              ))}
            </div>
          </InkReveal>
        </section>
      </div>

      {/* S5 · next */}
      <NextProject to="/about" title={t.next.title} subtitle={t.next.subtitle} />
    </>
  )
}
