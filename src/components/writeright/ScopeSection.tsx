import { motion } from 'framer-motion'
import { useLang } from '@/context/LangContext'
import { writeRightContent } from '@/content/writeRight'
import Kicker from '@/components/Kicker'
import InkReveal from '@/components/InkReveal'

const ZEN = [0.22, 1, 0.36, 1] as [number, number, number, number]

/** S2 · 做与不做 — honest scope: DOES (dai edge) vs. DOESN'T (faint edge, growing strikethrough). */
export default function ScopeSection() {
  const { lang } = useLang()
  const c = writeRightContent[lang].scope

  return (
    <section className="mx-auto max-w-shell px-5 py-[clamp(72px,12vh,128px)] md:px-10">
      <InkReveal>
        <Kicker>{c.kicker}</Kicker>
      </InkReveal>

      <div className="mt-10 grid gap-6 md:grid-cols-2 md:gap-10">
        {/* DOES */}
        <InkReveal delay={0.05}>
          <div className="h-full border-l-[3px] border-l-dai bg-museum-stone/45 py-1 pl-7 md:pl-9">
            <h3 className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-dai">
              {c.doesTitle}
            </h3>
            <ul className="mt-5 space-y-3">
              {c.does.map((item, i) => (
                <motion.li
                  key={item}
                  className="flex items-baseline gap-3 text-ink-2"
                  initial={{ y: 16, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{ duration: 0.45, ease: ZEN, delay: 0.15 + i * 0.06 }}
                >
                  <span aria-hidden="true" className="font-mono text-xs text-dai">
                    ·
                  </span>
                  {item}
                </motion.li>
              ))}
            </ul>
          </div>
        </InkReveal>

        {/* DOESN'T — each item grows a 1px strikethrough */}
        <InkReveal delay={0.2}>
          <div className="h-full border-l-[3px] border-l-faint bg-museum-stone/25 py-1 pl-7 md:pl-9">
            <h3 className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-faint">
              {c.doesntTitle}
            </h3>
            <ul className="mt-5 space-y-3">
              {c.doesnt.map((item, i) => (
                <motion.li
                  key={item}
                  className="flex items-baseline gap-3 text-ink-3"
                  initial={{ y: 16, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{ duration: 0.45, ease: ZEN, delay: 0.3 + i * 0.06 }}
                >
                  <span aria-hidden="true" className="font-mono text-xs text-faint">
                    ×
                  </span>
                  <span className="relative">
                    {item}
                    <motion.span
                      aria-hidden="true"
                      className="absolute left-0 top-1/2 h-px w-full origin-left bg-faint"
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true, amount: 0.6 }}
                      transition={{ duration: 0.4, ease: ZEN, delay: 0.55 + i * 0.15 }}
                    />
                  </span>
                </motion.li>
              ))}
            </ul>
          </div>
        </InkReveal>
      </div>

      <InkReveal delay={0.3}>
        <p className="mt-10 font-mono text-xs text-faint">{c.note}</p>
      </InkReveal>
    </section>
  )
}
