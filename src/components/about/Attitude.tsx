import { motion } from 'framer-motion'
import { useLang } from '@/context/LangContext'
import { aboutContent } from '@/content/about'
import BrassRule from '@/components/about/BrassRule'

const ZEN = [0.22, 1, 0.36, 1] as [number, number, number, number]

/**
 * S5 · 态度 The Attitude — closing line between brass rules.
 * Word-level ink reveal (stagger 0.1s); mono colophon underneath.
 */
export default function Attitude() {
  const { lang } = useLang()
  const c = aboutContent[lang].attitude

  /* zh splits into its two natural phrases; en splits on words */
  const units = lang === 'zh' ? ['用业余时间，', '认真折腾。'] : c.line.split(' ')

  return (
    <section aria-label={c.line} className="mx-auto max-w-shell px-5 md:px-10">
      <BrassRule className="mx-auto h-2 w-40" />
      <div className="py-[clamp(72px,12vh,128px)] text-center">
        <p className="mx-auto max-w-3xl font-serif text-[clamp(30px,4.5vw,48px)] font-bold leading-snug text-museum-ink">
          {units.map((u, i) => (
            <motion.span
              key={`${lang}-${u}`}
              className="inline-block whitespace-pre will-change-transform"
              initial={{ y: 32, opacity: 0, filter: 'blur(8px)' }}
              whileInView={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.9, ease: ZEN, delay: i * 0.1 }}
            >
              {u}
              {lang === 'en' && i < units.length - 1 ? ' ' : ''}
            </motion.span>
          ))}
        </p>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.8, ease: ZEN, delay: 0.3 }}
          className="mt-8 font-mono text-xs text-museum-muted"
        >
          {c.sub}
        </motion.p>
      </div>
      <BrassRule className="mx-auto mb-8 h-2 w-40" />
    </section>
  )
}
