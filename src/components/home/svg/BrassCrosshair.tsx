/** Quiet brass crosshair behind the cube. */
export default function BrassCrosshair({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 400 400"
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
    >
      <circle
        cx="200"
        cy="200"
        r="148"
        stroke="var(--museum-brass)"
        strokeWidth="0.6"
        opacity="0.18"
      />
      <line
        x1="200"
        y1="36"
        x2="200"
        y2="364"
        stroke="var(--museum-brass)"
        strokeWidth="0.5"
        opacity="0.22"
      />
      <line
        x1="36"
        y1="200"
        x2="364"
        y2="200"
        stroke="var(--museum-brass)"
        strokeWidth="0.5"
        opacity="0.22"
      />
      <circle cx="200" cy="200" r="3" fill="var(--museum-brass)" opacity="0.35" />
    </svg>
  )
}
