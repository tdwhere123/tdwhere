import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { useLang } from '@/context/LangContext'
import { ZEN } from '@/lib/motion'


/** Short manifesto strip between the works wall and the coda. */
export default function AboutTeaser() {
  const { t } = useLang()
  const reduce = useReducedMotion()

  return (
    <section className="border-t border-hairline">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease: ZEN }}
        className="mx-auto max-w-[65ch] px-6 py-24 text-center md:py-32"
      >
        <p className="font-display text-[clamp(24px,3vw,34px)] font-semibold leading-snug text-museum-ink">
          {t.aboutTeaser.lineA}
        </p>
        <p className="mt-4 text-base leading-relaxed text-museum-muted">
          {t.aboutTeaser.lineB}
        </p>
        <Link
          to="/about"
          className="mt-8 inline-block font-mono text-xs uppercase tracking-[0.16em] text-cobalt underline decoration-cobalt/40 underline-offset-8 transition-colors duration-300 hover:decoration-cobalt"
        >
          {t.aboutTeaser.link} ↗
        </Link>
      </motion.div>
    </section>
  )
}
