/** Quiet brass rule — museum section accent (do-it only). */
export default function BrassAccent({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 160 8"
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
    >
      <line
        x1="8"
        y1="4"
        x2="152"
        y2="4"
        stroke="var(--museum-brass)"
        strokeWidth="0.75"
        opacity="0.4"
      />
      <circle cx="80" cy="4" r="1.75" fill="var(--clay)" opacity="0.7" />
      <circle cx="8" cy="4" r="1" fill="var(--museum-brass)" opacity="0.35" />
      <circle cx="152" cy="4" r="1" fill="var(--museum-brass)" opacity="0.35" />
    </svg>
  )
}
