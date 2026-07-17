import { useLang } from '@/context/LangContext'
import { cn } from '@/lib/utils'

/** slow horizontal quote drift — 24s linear loop, pauses on hover. Quotes joined by `·`. */
export default function QuoteDrift({ className }: { className?: string }) {
  const { t } = useLang()
  const sequence = [...t.quotes, ...t.quotes]

  return (
    <div
      className={cn(
        'group relative flex h-[120px] items-center overflow-hidden',
        'border-y border-hairline',
        className,
      )}
      aria-label={t.quotes.join(' · ')}
    >
      <div className="flex w-max animate-quote-drift whitespace-nowrap group-hover:[animation-play-state:paused] motion-reduce:animate-none">
        {sequence.map((q, i) => (
          <span
            key={i}
            aria-hidden={i >= t.quotes.length}
            className="flex items-center font-mono text-sm text-ink-3"
          >
            <span className="px-6">{q}</span>
            <span className="text-faint">·</span>
          </span>
        ))}
      </div>
    </div>
  )
}
