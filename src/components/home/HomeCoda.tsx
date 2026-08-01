import { AnimatePresence, motion } from 'framer-motion'
import { useLang } from '@/context/LangContext'
import useCopyText from '@/hooks/useCopyText'
import Stamp from '@/components/Stamp'
import SealMark from '@/components/SealMark'
import SiteClue from '@/components/eggs/SiteClue'
import { ZEN } from '@/lib/motion'


export default function HomeCoda() {
  const { t } = useLang()
  const { copied, copy } = useCopyText(t.meta.email)

  return (
    <section className="home-coda relative mx-auto max-w-reading border-t border-hairline px-5 py-20 text-center md:py-28">
      <div aria-hidden="true" className="mx-auto mb-10 h-px w-24 bg-ink/20" />
      <div className="relative mx-auto mb-2 flex w-fit items-center justify-center gap-3">
        <SealMark size={36} className="opacity-80" />
        <SiteClue
          variant="timestamp"
          label={{ zh: '审讯', en: 'ASK' }}
          hint={{
            zh: '去角落的 SENTINEL 终端输入 interrogate。',
            en: 'In the playground SENTINEL terminal, type interrogate.',
          }}
          command="interrogate"
        />
      </div>

      <p className="font-display text-[24px] font-semibold leading-snug text-museum-ink md:text-[28px]">
        {t.coda.line}
      </p>

      <div className="mt-8 flex flex-col items-center gap-3">
        <a
          href={t.meta.githubUrl}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-sm text-museum-muted transition-colors hover:text-cobalt"
        >
          {t.meta.github}
        </a>

        <span className="relative inline-flex">
          <motion.button
            type="button"
            onClick={copy}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.25, ease: ZEN }}
            aria-label={`${t.common.copy}: ${t.meta.email}`}
            className="rounded-none border border-ink/25 px-7 py-3.5 font-mono text-sm text-museum-ink transition-colors duration-300 hover:border-cobalt hover:text-cobalt"
          >
            {t.meta.email}
          </motion.button>
          <AnimatePresence>
            {copied && (
              <motion.span
                key="coda-copied"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute -top-10 right-0"
              >
                <Stamp text={t.common.copied} animateOnView={false} />
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      </div>
    </section>
  )
}
