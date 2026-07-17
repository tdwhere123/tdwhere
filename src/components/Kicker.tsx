import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** mono label + 40px hairline, opens every section. e.g. — 01 · 流程 PROCESS */
export default function Kicker({
  children,
  className,
  light = false,
}: {
  children: ReactNode
  className?: string
  light?: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 font-mono text-xs font-medium uppercase tracking-[0.14em]',
        light ? 'text-amber-dim' : 'text-faint',
        className,
      )}
    >
      <span className="whitespace-nowrap">{children}</span>
      <span
        aria-hidden="true"
        className={cn('h-px w-10', light ? 'bg-amber-dim/50' : 'bg-hairline')}
      />
    </div>
  )
}
