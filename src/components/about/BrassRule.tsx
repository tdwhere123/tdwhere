import { cn } from '@/lib/utils'

/** Thin brass rule — section break for About (museum accent, not a card). */
export default function BrassRule({ className }: { className?: string }) {
  return (
    <svg
      className={cn('text-museum-brass', className)}
      viewBox="0 0 240 8"
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <line
        x1="0"
        y1="4"
        x2="240"
        y2="4"
        stroke="currentColor"
        strokeWidth="0.75"
        opacity="0.5"
      />
      <circle cx="120" cy="4" r="2" fill="currentColor" opacity="0.6" />
    </svg>
  )
}
