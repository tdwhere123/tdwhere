import { motion } from 'framer-motion'
import { useLang } from '@/context/LangContext'
import { playground } from '@/content/playground'
import Kicker from '@/components/Kicker'
import InkReveal from '@/components/InkReveal'
import GateDivider from '@/components/GateDivider'
import NextProject from '@/components/NextProject'
import SentinelTerminal from '@/components/playground/SentinelTerminal'
import VegetarianCards from '@/components/playground/VegetarianCards'

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
      {/* S1 · header */}
      <header className="mx-auto max-w-shell px-5 pb-20 pt-[clamp(64px,10vh,112px)] md:px-10">
        <InkReveal>
          <Kicker>{t.header.kicker}</Kicker>
        </InkReveal>
        <InkReveal delay={0.1}>
          <h1 className="mt-6 font-serif text-h1 font-bold text-ink">
            {t.header.title}
            <span className="ml-4 align-middle font-mono text-sm font-normal uppercase tracking-[0.14em] text-faint">
              {t.header.titleEn}
            </span>
          </h1>
        </InkReveal>
        <InkReveal delay={0.2}>
          <p className="mt-6 max-w-reading text-base leading-[1.85] text-ink-3 md:text-[17px]">
            {t.header.intro}
          </p>
        </InkReveal>
      </header>

      {/* S2 · SENTINEL dark room */}
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-shell px-3 md:px-6"
      >
        <SentinelTerminal />
      </motion.div>

      <GateDivider className="mx-auto mt-[clamp(96px,15vh,168px)] max-w-shell px-5 md:px-10" />

      {/* S3 · vegetarian drawer */}
      <VegetarianCards />

      {/* S4 · a note on ruins */}
      <section className="mx-auto max-w-reading px-5 pb-[clamp(96px,15vh,168px)] md:px-10">
        <InkReveal>
          <Kicker>{t.ruins.kicker}</Kicker>
        </InkReveal>
        <InkReveal delay={0.1}>
          <div className="mt-8 space-y-8 rounded-[16px] border border-museum-line bg-museum-stone px-7 py-10 md:px-10">
            {t.ruins.quotes.map((q, i) => (
              <QuoteLine key={q} text={q} delay={0.15 + i * 0.15} />
            ))}
          </div>
        </InkReveal>
      </section>

      {/* S5 · next */}
      <NextProject to="/about" title={t.next.title} subtitle={t.next.subtitle} />
    </>
  )
}
