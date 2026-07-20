import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLang } from '@/context/LangContext'
import useCopyText from '@/hooks/useCopyText'
import Stamp from '@/components/Stamp'
import SealMark from '@/components/SealMark'
import SiteClue from '@/components/eggs/SiteClue'
import BrassRule from './svg/BrassRule'

const ZEN = [0.22, 1, 0.36, 1] as [number, number, number, number]

export default function HomeCoda() {
  const { t, lang } = useLang()
  const { copied, copy } = useCopyText(t.meta.email)
  const line =
    lang === 'zh'
      ? '所有项目都在 GitHub 上。'
      : 'Every project lives on GitHub.'

  return (
    <section className="relative mx-auto max-w-reading px-5 py-24 text-center md:py-32">
      <BrassRule className="mx-auto mb-10 h-2 w-40" />
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

      <p className="font-serif text-[24px] font-semibold leading-snug text-museum-ink md:text-[28px]">
        {line}
      </p>

      <div className="mt-8 flex flex-col items-center gap-3">
        <a
          href={t.meta.githubUrl}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-sm text-museum-muted transition-colors hover:text-museum-ink"
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
            className="rounded-full border border-museum-brass/40 px-7 py-3.5 font-mono text-sm text-museum-ink transition-colors duration-300 hover:border-museum-brass hover:bg-museum-stone/40"
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

/** Sets body[data-home-cube] while mounted. */
export function useHomeCubeBodyFlag() {
  useEffect(() => {
    document.body.setAttribute('data-home-cube', '')
    return () => document.body.removeAttribute('data-home-cube')
  }, [])
}

export function useHasScrolledOnce(threshold = 40) {
  const [scrolled, setScrolled] = useState(false)
  const done = useRef(false)
  useEffect(() => {
    const onScroll = () => {
      if (done.current) return
      if (window.scrollY > threshold) {
        done.current = true
        setScrolled(true)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])
  return scrolled
}
