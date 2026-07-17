/** Soft elliptical plinth under the cube — museum stage, not a product shadow. */
export default function MuseumPlinth({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 400 80"
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
    >
      <ellipse cx="200" cy="48" rx="170" ry="22" fill="var(--museum-ink)" opacity="0.07" />
      <ellipse
        cx="200"
        cy="44"
        rx="140"
        ry="14"
        stroke="var(--museum-brass)"
        strokeWidth="0.75"
        opacity="0.35"
      />
    </svg>
  )
}
