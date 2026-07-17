import { AnimatePresence, motion } from 'framer-motion'
import { useLang } from '@/context/LangContext'
import Stamp from '@/components/Stamp'
import useCopyText from '@/hooks/useCopyText'
import { cn } from '@/lib/utils'

/**
 * CopyEmail — click to copy the address; on success a small 「已复制 / Copied」
 * stamp lands with the 盖章 motion beside the address.
 */
export default function CopyEmail({
  className,
  textClassName,
  showHint = true,
}: {
  className?: string
  textClassName?: string
  showHint?: boolean
}) {
  const { t } = useLang()
  const { copied, copy } = useCopyText(t.meta.email)

  return (
    <span className={cn('relative inline-flex items-center gap-3', className)}>
      <button
        type="button"
        onClick={copy}
        aria-label={`${t.common.copy}: ${t.meta.email}`}
        className={cn(
          'group relative font-mono text-ink-3 transition-colors duration-300 hover:text-ink',
          textClassName,
        )}
      >
        {t.meta.email}
        <span
          aria-hidden="true"
          className="absolute -bottom-0.5 left-0 h-px w-0 bg-ink transition-all duration-300 ease-zen group-hover:w-full"
        />
      </button>
      {showHint && <span className="font-mono text-xs text-faint">{t.common.copyHint}</span>}
      <AnimatePresence>
        {copied && (
          <motion.span
            key="copied-stamp"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.25 } }}
            className="absolute -top-9 right-0"
          >
            <Stamp text={t.common.copied} animateOnView={false} />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}
