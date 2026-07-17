import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** mono 12px pill — 1px hairline border, paper bg. e.g. v0.14.1 · MIT · ⭐ 22 · TypeScript */
export default function MetaChip({
  children,
  className,
  accent = false,
}: {
  children: ReactNode
  className?: string
  /** accent chips turn seal on hover (e.g. the email chip) */
  accent?: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-hairline bg-paper px-3 py-1',
        'font-mono text-xs text-ink-3 transition-colors duration-300',
        accent && 'hover:border-seal hover:text-ink',
        className,
      )}
    >
      {children}
    </span>
  )
}
