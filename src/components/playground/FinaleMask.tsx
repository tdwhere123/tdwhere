import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLang } from '@/context/LangContext'
import { FINALE_QUESTION, FINALE_SUB } from '@/lib/sentinel-eggs'

type Props = {
  open: boolean
  onClose: () => void
}

/**
 * Full-screen mask after all five concept cards are collected.
 * One question — from the PRD’s final-review / identity theme.
 */
export default function FinaleMask({ open, onClose }: Props) {
  const { lang } = useLang()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="finale-mask"
          role="dialog"
          aria-modal="true"
          aria-labelledby="finale-question"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55 }}
          className="fixed inset-0 z-[90] flex cursor-pointer items-center justify-center px-6"
          style={{
            background:
              'radial-gradient(ellipse 70% 55% at 50% 42%, rgba(18,22,28,0.72) 0%, rgba(8,10,14,0.92) 100%)',
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/45">
              {FINALE_SUB[lang]}
            </p>
            <h2
              id="finale-question"
              className="mt-8 font-serif text-[clamp(22px,4.2vw,34px)] font-semibold leading-[1.45] text-white/95"
            >
              {FINALE_QUESTION[lang]}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="mt-12 font-mono text-[11px] uppercase tracking-[0.2em] text-white/50 transition-colors hover:text-white/85"
            >
              {lang === 'zh' ? '轻触关闭 · 问题留下' : 'Tap to close · the question remains'}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
