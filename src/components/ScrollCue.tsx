import { useLang } from '@/context/LangContext'
import { cn } from '@/lib/utils'

/** hero bottom cue: 向下 · SCROLL + 1px vertical line with a falling ink dot (2.2s loop). */
export default function ScrollCue({ className }: { className?: string }) {
  const { t } = useLang()
  return (
    <div
      aria-hidden="true"
      className={cn('flex flex-col items-center gap-3', className)}
    >
      <span className="font-mono text-xs uppercase tracking-[0.14em] text-faint">
        {t.hero.scroll}
      </span>
      <span className="relative block h-10 w-px overflow-hidden bg-hairline">
        <span className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-ink-3 animate-cue-drop" />
      </span>
    </div>
  )
}
