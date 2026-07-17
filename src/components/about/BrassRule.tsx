/** Thin brass rule — section break for About (museum accent, not a card). */
export default function BrassRule({ className }: { className?: string }) {
  return (
    <svg
      className={className}
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
        stroke="var(--museum-brass)"
        strokeWidth="0.75"
        opacity="0.45"
      />
      <circle cx="120" cy="4" r="2" fill="var(--museum-brass)" opacity="0.55" />
    </svg>
  )
}
