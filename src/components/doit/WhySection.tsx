import { motion } from 'framer-motion'
import { useLang } from '@/context/LangContext'
import { doItContent } from '@/content/doIt'
import Kicker from '@/components/Kicker'
import InkReveal from '@/components/InkReveal'

const ZEN = [0.22, 1, 0.36, 1] as [number, number, number, number]

/** S2 · 缘起 / Why — itch panel (museum stone, clay edge) vs. the move. */
export default function WhySection() {
  const { lang } = useLang()
  const c = doItContent[lang].why

  return (
    <section className="mx-auto max-w-shell px-5 py-[clamp(72px,12vh,128px)] md:px-10">
      <InkReveal>
        <Kicker>{c.kicker}</Kicker>
      </InkReveal>

      <div className="mt-10 grid gap-6 md:grid-cols-2 md:gap-10">
        {/* the itch — problem panel */}
        <InkReveal delay={0.05}>
          <div className="relative h-full overflow-hidden bg-museum-stone p-7 md:p-9">
            <motion.span
              aria-hidden="true"
              className="absolute left-0 top-0 h-full w-1 origin-top bg-clay"
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.6, ease: ZEN, delay: 0.2 }}
            />
            <h3 className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-ink-3">
              {c.itchTitle}
            </h3>
            <p className="mt-4 leading-[1.85] text-ink-2">{c.itch}</p>
          </div>
        </InkReveal>

        {/* the move — solution text */}
        <InkReveal delay={0.2}>
          <div className="flex h-full flex-col justify-center border-t border-museum-brass/30 p-1 pt-6 md:border-t-0 md:p-4 md:pt-4">
            <h3 className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-ink-3">
              {c.moveTitle}
            </h3>
            <p className="mt-4 font-serif text-h3 leading-relaxed text-museum-ink">{c.move}</p>
          </div>
        </InkReveal>
      </div>

      <InkReveal delay={0.3}>
        <p className="mt-10 font-mono text-xs text-ink-3">{c.note}</p>
      </InkReveal>
    </section>
  )
}
