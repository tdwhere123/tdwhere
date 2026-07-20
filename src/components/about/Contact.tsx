import { motion } from 'framer-motion'
import { ArrowUpRight, Github } from 'lucide-react'
import { useLang } from '@/context/LangContext'
import { aboutContent } from '@/content/about'
import CopyEmail from '@/components/CopyEmail'
import InkReveal from '@/components/InkReveal'
import Kicker from '@/components/Kicker'
import BrassRule from '@/components/about/BrassRule'
import SiteClue from '@/components/eggs/SiteClue'

/**
 * S4 · 联系 Say Hello — stone panel: 「写信来。」+ copy-email pill
 * (stamp feedback) + GitHub link + quiet footnote. Brass accents only.
 */
export default function Contact() {
  const { t, lang } = useLang()
  const c = aboutContent[lang].contact

  return (
    <section
      aria-labelledby="contact-title"
      className="mx-auto max-w-shell px-5 py-[clamp(72px,12vh,140px)] md:px-10"
    >
      <BrassRule className="mx-auto mb-12 h-2 w-36 text-museum-brass" />
      <InkReveal amount={0.25}>
        <div className="mx-auto max-w-3xl border border-museum-brass/20 bg-museum-stone px-6 py-12 text-center md:p-16">
          <Kicker className="justify-center">{c.kicker}</Kicker>

          <h2
            id="contact-title"
            className="mt-6 font-serif text-[clamp(26px,4vw,40px)] font-semibold leading-snug text-museum-ink"
          >
            {c.big}
          </h2>

          {/* email — click to copy, stamp lands on success */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 inline-flex max-w-full rounded-full border border-museum-brass/40 bg-museum-bg px-6 py-3.5 transition-colors duration-300 hover:border-museum-brass md:px-8"
          >
            <CopyEmail textClassName="text-sm md:text-xl" showHint={false} />
          </motion.div>

          {/* GitHub link */}
          <div className="mt-6 flex justify-center">
            <a
              href={t.meta.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-center gap-3 border border-museum-brass/30 bg-museum-bg px-6 py-4 transition-all duration-300 ease-zen hover:-translate-y-1 hover:border-museum-brass/60"
            >
              <Github
                aria-hidden="true"
                className="h-5 w-5 text-museum-muted transition-colors duration-300 group-hover:text-museum-brass"
              />
              <span className="text-left">
                <span className="block font-mono text-sm text-museum-ink">{t.meta.github}</span>
                <span className="block font-mono text-xs text-museum-muted">{c.githubHint}</span>
              </span>
              <ArrowUpRight
                aria-hidden="true"
                className="h-4 w-4 text-museum-muted transition-all duration-300 ease-zen group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-museum-ink"
              />
            </a>
          </div>

          <p className="mx-auto mt-10 max-w-md font-mono text-xs leading-relaxed text-museum-muted">
            {c.note}
          </p>

          <div className="mt-6 flex justify-center">
            <SiteClue
              variant="stamp"
              label={{ zh: 'LEDGER', en: 'LEDGER' }}
              hint={{
                zh: '纸质账本还在运转。去角落的 SENTINEL 终端试试。',
                en: 'The paper ledger still runs. Try it in the SENTINEL terminal at the playground.',
              }}
              command="ledger"
            />
          </div>
        </div>
      </InkReveal>
    </section>
  )
}
