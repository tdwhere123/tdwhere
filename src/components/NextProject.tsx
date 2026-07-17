import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useLang } from '@/context/LangContext'

/**
 * NextProject — big link card at the bottom of project pages: 「下一间屋子 →」.
 * Ink-reveal entrance; hover grows the ink underline and slides the arrow.
 */
export default function NextProject({
  to,
  title,
  subtitle,
}: {
  to: string
  title: string
  subtitle?: string
}) {
  const { t } = useLang()
  return (
    <motion.div
      initial={{ y: 40, opacity: 0, filter: 'blur(8px)' }}
      whileInView={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className="border-t border-hairline"
    >
      <Link
        to={to}
        className="group mx-auto flex max-w-shell items-center justify-between gap-6 px-6 py-16 md:px-10"
      >
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-faint">
            {t.common.nextRoom} →
          </p>
          <p className="relative mt-3 font-serif text-h2 font-semibold text-ink">
            {title}
            <span
              aria-hidden="true"
              className="absolute -bottom-2 left-0 h-px w-0 bg-ink transition-all duration-500 ease-zen group-hover:w-full"
            />
          </p>
          {subtitle && <p className="mt-4 text-sm text-ink-3">{subtitle}</p>}
        </div>
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-hairline text-ink-3 transition-all duration-300 ease-zen group-hover:translate-x-1.5 group-hover:border-ink group-hover:text-ink">
          <ArrowRight className="h-5 w-5" />
        </span>
      </Link>
    </motion.div>
  )
}
