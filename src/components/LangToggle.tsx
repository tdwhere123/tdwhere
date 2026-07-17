import { useLang } from '@/context/LangContext'
import type { Lang } from '@/context/LangContext'
import { cn } from '@/lib/utils'

const OPTIONS: { value: Lang; label: string }[] = [
  { value: 'zh', label: '中' },
  { value: 'en', label: 'EN' },
]

/** mono 中 | EN — active: ink text + 2px seal underline; inactive: faint. */
export default function LangToggle({ className }: { className?: string }) {
  const { lang, setLang } = useLang()
  return (
    <div
      className={cn('flex items-center gap-2 font-mono text-[13px] tracking-[0.08em]', className)}
      role="group"
      aria-label="Language / 语言"
    >
      {OPTIONS.map((opt, i) => (
        <span key={opt.value} className="flex items-center gap-2">
          {i > 0 && <span className="text-faint select-none">|</span>}
          <button
            type="button"
            onClick={() => setLang(opt.value)}
            aria-pressed={lang === opt.value}
            className={cn(
              'relative pb-[3px] transition-colors duration-300',
              lang === opt.value ? 'text-ink' : 'text-faint hover:text-ink-3',
            )}
          >
            {opt.label}
            <span
              aria-hidden="true"
              className={cn(
                'absolute left-1/2 -translate-x-1/2 -bottom-[1px] h-[2px] bg-seal transition-all duration-300 ease-zen',
                lang === opt.value ? 'w-4' : 'w-0',
              )}
            />
          </button>
        </span>
      ))}
    </div>
  )
}
