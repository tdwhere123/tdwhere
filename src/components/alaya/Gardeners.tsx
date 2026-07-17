import { motion } from 'framer-motion'
import { CalendarClock, Eraser, LibraryBig, ScanSearch } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useLang } from '@/context/LangContext'
import { alayaContent } from '@/content/alaya'
import InkReveal from '@/components/InkReveal'
import Kicker from '@/components/Kicker'

const ZEN = [0.22, 1, 0.36, 1] as [number, number, number, number]
const ICONS: LucideIcon[] = [ScanSearch, Eraser, LibraryBig, CalendarClock]

/**
 * S6 · The Gardeners — four background roles. Hover grows a restrained 1px
 * "branch" from the card top; every card foots the same seal line:
 * proposes only, never writes.
 */
export default function Gardeners() {
  const { lang } = useLang()
  const a = alayaContent[lang].garden

  return (
    <section className="mx-auto max-w-demo px-5 py-24 md:px-10 md:py-32" aria-label={a.title}>
      <InkReveal amount={0.5}>
        <Kicker>{a.kicker}</Kicker>
      </InkReveal>
      <InkReveal amount={0.4} delay={0.08}>
        <h2 className="mt-6 font-serif text-h2 font-semibold text-ink">{a.title}</h2>
      </InkReveal>

      <div className="mt-14 grid grid-cols-2 gap-4 pt-6 lg:grid-cols-4">
        {a.roles.map((role, i) => {
          const Icon = ICONS[i] ?? ScanSearch
          return (
            <motion.div
              key={role.name}
              initial={{ y: 40, opacity: 0, filter: 'blur(8px)' }}
              whileInView={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.9, ease: ZEN, delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className="group relative flex min-h-[220px] flex-col rounded-[10px] border border-hairline bg-paper p-5 transition-colors duration-300 hover:border-moss/60"
            >
              {/* the branch — grows on hover, 0.4s, origin bottom */}
              <span
                aria-hidden="true"
                className="absolute -top-6 left-1/2 h-6 w-px origin-bottom scale-y-0 bg-moss transition-transform [transition-duration:400ms] ease-zen group-hover:scale-y-100"
              />
              <Icon className="h-5 w-5 text-museum-brass" aria-hidden="true" />
              <h3 className="mt-4 font-serif text-lg font-semibold text-ink">{role.name}</h3>
              <p className="font-mono text-[11px] text-faint">{role.zh}</p>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-3">{role.duty}</p>
              <p className="mt-4 border-t border-hairline pt-3 font-mono text-[11px] text-seal/75">
                {a.line}
              </p>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
