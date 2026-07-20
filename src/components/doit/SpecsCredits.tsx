import { motion } from 'framer-motion'
import { ExternalLink } from 'lucide-react'
import { useLang } from '@/context/LangContext'
import { doItContent } from '@/content/doIt'
import Kicker from '@/components/Kicker'
import InkReveal from '@/components/InkReveal'
import BrassAccent from '@/components/doit/BrassAccent'

const ZEN = [0.22, 1, 0.36, 1] as [number, number, number, number]

/** S6 · 规格与致谢 — buckets chips + standing-on-shoulders links. */
export default function SpecsCredits() {
  const { lang } = useLang()
  const c = doItContent[lang].specs

  return (
    <section className="mx-auto max-w-shell px-5 py-[clamp(72px,12vh,128px)] md:px-10">
      <InkReveal>
        <Kicker>{c.kicker}</Kicker>
      </InkReveal>

      <div className="mt-10 grid gap-12 md:grid-cols-2">
        {/* buckets */}
        <div>
          <h3 className="font-serif text-h3 font-semibold text-museum-ink">{c.bucketsTitle}</h3>
          <div className="mt-5 flex flex-wrap gap-2">
            {c.buckets.map((b, i) => (
              <motion.span
                key={b}
                className="rounded-[4px] border border-museum-brass/35 bg-museum-stone/70 px-3 py-1 font-mono text-xs text-ink-2"
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.35, ease: ZEN, delay: i * 0.04 }}
              >
                {b}
              </motion.span>
            ))}
            <motion.span
              className="rounded-[4px] border border-dashed border-museum-brass/30 px-3 py-1 font-mono text-xs text-ink-3"
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.35, ease: ZEN, delay: c.buckets.length * 0.04 }}
            >
              + {c.extensions}
            </motion.span>
          </div>
        </div>

        {/* credits */}
        <div>
          <h3 className="font-serif text-h3 font-semibold text-museum-ink">{c.creditsTitle}</h3>
          <ul className="mt-5 space-y-3">
            {c.credits.map((repo, i) => (
              <motion.li
                key={repo}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.35, ease: ZEN, delay: i * 0.04 }}
              >
                <a
                  href={`https://github.com/${repo}`}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative inline-flex items-center gap-1.5 font-mono text-sm text-ink-3 transition-colors duration-300 hover:text-clay"
                >
                  {repo}
                  <ExternalLink
                    aria-hidden="true"
                    className="h-3.5 w-3.5 transition-transform duration-300 ease-zen group-hover:translate-x-1"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-0.5 left-0 h-px w-0 bg-clay transition-all duration-300 ease-zen group-hover:w-full"
                  />
                </a>
              </motion.li>
            ))}
          </ul>
          <p className="mt-5 text-sm text-ink-3">{c.creditsNote}</p>
        </div>
      </div>

      <InkReveal delay={0.2}>
        <BrassAccent className="mx-auto mt-14 h-2 w-36" />
      </InkReveal>
    </section>
  )
}
