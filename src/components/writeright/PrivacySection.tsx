import { motion } from 'framer-motion'
import { useLang } from '@/context/LangContext'
import { writeRightContent } from '@/content/writeRight'
import Kicker from '@/components/Kicker'
import InkReveal from '@/components/InkReveal'

const ZEN = [0.22, 1, 0.36, 1] as [number, number, number, number]

/** S6 · 隐私与边界 — narrow reading band, dai edge grows in. */
export default function PrivacySection() {
  const { lang } = useLang()
  const c = writeRightContent[lang].privacy

  return (
    <section className="mx-auto max-w-shell px-5 py-[clamp(72px,12vh,128px)] md:px-10">
      <InkReveal>
        <Kicker>{c.kicker}</Kicker>
      </InkReveal>

      <InkReveal delay={0.1}>
        <div className="relative mt-10 max-w-reading overflow-hidden border-l-[3px] border-l-transparent py-1 pl-7 md:pl-9">
          <motion.span
            aria-hidden="true"
            className="absolute left-0 top-0 h-full w-[3px] origin-top bg-dai"
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6, ease: ZEN, delay: 0.2 }}
          />
          <div className="space-y-4">
            {c.lines.map((line) => (
              <p key={line} className="font-serif text-lg leading-relaxed text-ink-2">
                {line}
              </p>
            ))}
          </div>
        </div>
      </InkReveal>
    </section>
  )
}
