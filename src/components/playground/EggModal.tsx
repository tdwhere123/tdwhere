import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useLang } from '@/context/LangContext'
import {
  type SentinelCard,
  unlockedCount,
  ALL_CARD_IDS,
} from '@/lib/sentinel-eggs'

type Props = {
  card: SentinelCard | null
  open: boolean
  onClose: () => void
  /** Fired after close when this unlock completed the set of five. */
  onReadyForFinale?: () => void
}

/** Museum-stone fallback when concept-art PNG is not yet uploaded. */
function CardFallback({ title, lang }: { title: string; lang: 'zh' | 'en' }) {
  return (
    <div
      className="flex aspect-[16/10] w-full flex-col items-center justify-center gap-3 rounded-[6px] border px-6 text-center"
      style={{
        borderColor: 'color-mix(in srgb, var(--museum-brass) 38%, transparent)',
        background:
          'linear-gradient(165deg, color-mix(in srgb, var(--museum-stone) 82%, white) 0%, var(--museum-stone) 100%)',
        boxShadow: 'inset 0 1px 0 color-mix(in srgb, white 28%, transparent)',
      }}
    >
      <span
        aria-hidden="true"
        className="font-mono text-[10px] uppercase tracking-[0.28em]"
        style={{ color: 'color-mix(in srgb, var(--museum-brass) 70%, var(--museum-ink))' }}
      >
        CONCEPT · PENDING
      </span>
      <p className="font-serif text-lg font-semibold text-museum-ink">{title}</p>
      <p className="max-w-xs text-[13px] leading-relaxed text-museum-muted">
        {lang === 'zh' ? '概念图待上架 — 玩法说明仍可读。' : 'Artwork pending — the lesson still stands.'}
      </p>
    </div>
  )
}

export default function EggModal({ card, open, onClose, onReadyForFinale }: Props) {
  const { lang } = useLang()
  const [imgFailed, setImgFailed] = useState(false)
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (open && card) {
      setImgFailed(false)
      setCount(unlockedCount())
    }
  }, [open, card])

  const handleClose = useCallback(() => {
    const complete = unlockedCount() >= ALL_CARD_IDS.length
    onClose()
    if (complete) onReadyForFinale?.()
  }, [onClose, onReadyForFinale])

  const title = card ? card.title[lang] : ''
  const lesson = card ? card.lesson[lang] : ''
  const mechanic = card ? card.mechanic[lang] : ''

  return (
    <AnimatePresence>
      {open && card && (
        <motion.div
          key="egg-backdrop"
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
          onClick={handleClose}
        >
          <motion.div
            key={card.id}
            role="dialog"
            aria-modal="true"
            aria-labelledby="egg-modal-title"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[12px] border bg-museum-bg shadow-2xl"
            style={{ borderColor: 'color-mix(in srgb, var(--museum-brass) 42%, transparent)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleClose}
              aria-label={lang === 'zh' ? '关闭' : 'Close'}
              className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full border transition-colors hover:bg-museum-stone/60"
              style={{ borderColor: 'color-mix(in srgb, var(--museum-brass) 35%, transparent)' }}
            >
              <X className="h-4 w-4 text-museum-ink" />
            </button>

            <div className="p-5 md:p-6">
              {imgFailed ? (
                <CardFallback title={title} lang={lang} />
              ) : (
                <img
                  src={card.image}
                  alt={title}
                  className="aspect-[16/10] w-full rounded-[6px] border object-cover object-top"
                  style={{ borderColor: 'color-mix(in srgb, var(--museum-brass) 30%, transparent)' }}
                  onError={() => setImgFailed(true)}
                />
              )}

              <p
                id="egg-modal-title"
                className="mt-5 font-mono text-[10px] uppercase tracking-[0.22em] text-museum-muted"
              >
                Gibberish-SENTINEL · {card.id}/05 · {count}/5
              </p>
              <h3 className="mt-2 font-serif text-xl font-semibold text-museum-ink">{title}</h3>
              <p
                className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em]"
                style={{ color: 'color-mix(in srgb, var(--museum-brass) 85%, var(--museum-ink))' }}
              >
                {mechanic}
              </p>
              <p className="mt-3 text-[15px] leading-[1.85] text-ink-2">{lesson}</p>
              <p className="mt-4 font-mono text-[11px] text-ink-3">
                {lang === 'zh'
                  ? count >= 5
                    ? '五张卡片已齐。关闭后，蒙版会问你一个问题。'
                    : `卡片已收入 · 还差 ${5 - count} 张。`
                  : count >= 5
                    ? 'All five cards filed. Close — a mask will ask you one question.'
                    : `Card filed · ${5 - count} remaining.`}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
