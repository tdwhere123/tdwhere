/** Soft elliptical plinth under the cube — museum stage with contact mass. */
export default function MuseumPlinth({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 400 90"
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
    >
      <ellipse cx="200" cy="58" rx="188" ry="26" fill="var(--museum-ink)" opacity="0.1" />
      <ellipse cx="200" cy="52" rx="162" ry="18" fill="var(--museum-ink)" opacity="0.06" />
      <ellipse
        cx="200"
        cy="46"
        rx="148"
        ry="12"
        stroke="var(--museum-brass)"
        strokeWidth="0.9"
        opacity="0.42"
      />
      <ellipse
        cx="200"
        cy="46"
        rx="118"
        ry="7"
        stroke="var(--museum-brass)"
        strokeWidth="0.5"
        opacity="0.22"
      />
    </svg>
  )
}
