import { cn } from '@/lib/utils'

/** 1px hairline with a 9×9px open "gate" at center — the section divider. */
export default function GateDivider({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn('relative flex items-center justify-center', className)}>
      <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-hairline" />
      <span className="relative z-10 block h-[9px] w-[9px] border border-hairline bg-paper" />
    </div>
  )
}
