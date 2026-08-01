/** Quiet cobalt rule — museum section accent (do-it only). */
export default function CobaltAccent({ className }: { className?: string }) {
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
        stroke="var(--cobalt)"
        strokeWidth="0.75"
        opacity="0.5"
      />
      <circle cx="80" cy="4" r="1.75" fill="var(--clay)" opacity="0.75" />
      <circle cx="8" cy="4" r="1" fill="var(--cobalt)" opacity="0.45" />
      <circle cx="152" cy="4" r="1" fill="var(--cobalt)" opacity="0.45" />
    </svg>
  )
}
