import { motion } from 'framer-motion'
import { useLang } from '@/context/LangContext'
import { alayaContent } from '@/content/alaya'
import InkReveal from '@/components/InkReveal'
import Kicker from '@/components/Kicker'
import SiteClue from '@/components/eggs/SiteClue'

const ZEN = [0.22, 1, 0.36, 1] as [number, number, number, number]

/** S7 · An Honest Footnote — R@5 → 90% NOT yet claimed. No stamps, plain face. */
export default function Footnote() {
  const { lang } = useLang()
  const a = alayaContent[lang].footnote

  return (
    <section className="mx-auto max-w-reading px-5 py-24 md:py-32" aria-label={a.kicker}>
      <InkReveal amount={0.5}>
        <Kicker>{a.kicker}</Kicker>
      </InkReveal>
      <InkReveal amount={0.4} className="mt-8">
        <div className="relative overflow-hidden rounded-[10px] border border-hairline bg-museum-bg-deep px-6 py-6">
          <motion.span
            aria-hidden="true"
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.5, ease: ZEN }}
            className="absolute inset-y-0 left-0 w-1 origin-top bg-moss"
          />
          <p className="pl-2 font-mono text-sm leading-relaxed text-ink-2">{a.line1}</p>
          <p className="mt-3 pl-2 text-sm leading-relaxed text-ink-3">{a.line2}</p>
          <div className="mt-4 pl-2">
            <SiteClue
              variant="seal"
              label={{ zh: '材', en: 'M' }}
              hint={{
                zh: '记忆之屋的材料要挑选。去 SENTINEL 输入 materials。',
                en: 'Materials in the memory house must be chosen. Type materials in SENTINEL.',
              }}
              command="materials"
            />
          </div>
        </div>
      </InkReveal>
    </section>
  )
}
