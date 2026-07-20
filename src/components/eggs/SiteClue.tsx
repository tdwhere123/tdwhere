import { useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLang } from '@/context/LangContext'
import { cn } from '@/lib/utils'

export type SiteClueVariant = 'stamp' | 'timestamp' | 'seal' | 'marginalia'

type Props = {
  variant: SiteClueVariant
  /** Faint visible mark on the page. */
  label: { zh: string; en: string }
  /** Hint shown after interaction. */
  hint: { zh: string; en: string }
  /** Optional terminal command copied on click. */
  command?: string
  className?: string
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

/**
 * Subtle cross-site clue — museum-tone marginalia that nudges players toward
 * SENTINEL terminal commands. Click reveals a tiny toast; optional command copies.
 */
export default function SiteClue({ variant, label, hint, command, className }: Props) {
  const { lang } = useLang()
  const [toast, setToast] = useState(false)
  const [copied, setCopied] = useState(false)

  const reveal = useCallback(async () => {
    setToast(true)
    if (command) {
      const ok = await copyText(command)
      setCopied(ok)
    }
    window.setTimeout(() => {
      setToast(false)
      setCopied(false)
    }, 2800)
  }, [command])

  const labelText = label[lang]
  const hintText = hint[lang]

  return (
    <span className={cn('relative inline-block', className)}>
      <button
        type="button"
        onClick={() => void reveal()}
        aria-label={hintText}
        className={cn(
          'group cursor-pointer border-0 bg-transparent p-0 transition-opacity duration-500',
          'opacity-[0.38] hover:opacity-90 focus-visible:opacity-90 focus-visible:outline-none',
          variant === 'timestamp' && 'font-mono text-[10px] tracking-[0.18em]',
          variant === 'stamp' && 'font-mono text-[9px] uppercase tracking-[0.24em]',
          variant === 'seal' && 'font-mono text-[9px] uppercase tracking-[0.2em]',
          variant === 'marginalia' && 'font-serif text-[11px] italic',
        )}
        style={{ color: 'color-mix(in srgb, var(--museum-brass) 72%, var(--museum-ink))' }}
      >
        {variant === 'seal' ? (
          <span
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border transition-transform duration-300 group-hover:scale-105"
            style={{
              borderColor: 'color-mix(in srgb, var(--museum-brass) 55%, transparent)',
              background: 'color-mix(in srgb, var(--museum-brass) 8%, transparent)',
            }}
          >
            {labelText}
          </span>
        ) : (
          <span className="underline decoration-dotted decoration-museum-brass/40 underline-offset-[3px]">
            {labelText}
          </span>
        )}
      </button>

      <AnimatePresence>
        {toast && (
          <motion.span
            key="site-clue-toast"
            role="status"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.22 }}
            className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-50 w-max max-w-[min(240px,70vw)] -translate-x-1/2 rounded-[6px] border px-3 py-2 text-center text-[11px] leading-snug shadow-md"
            style={{
              borderColor: 'color-mix(in srgb, var(--museum-brass) 40%, transparent)',
              background: 'color-mix(in srgb, var(--museum-stone) 92%, white)',
              color: 'var(--museum-ink)',
            }}
          >
            {hintText}
            {command && (
              <span className="mt-1 block font-mono text-[10px] text-museum-muted">
                {copied
                  ? lang === 'zh'
                    ? `已复制：${command}`
                    : `Copied: ${command}`
                  : lang === 'zh'
                    ? `去 SENTINEL 终端试试：${command}`
                    : `Try in SENTINEL: ${command}`}
              </span>
            )}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}
