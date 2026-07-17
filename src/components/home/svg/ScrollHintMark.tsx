/** Thin brass chevron for scroll hint. */
export default function ScrollHintMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="28"
      viewBox="0 0 16 28"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 2v18M3 15l5 7 5-7"
        stroke="var(--museum-brass)"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
    </svg>
  )
}
