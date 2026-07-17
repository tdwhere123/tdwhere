/** Stage navigation tick — hollow ring inactive, filled + bar active. */
export default function StageTick({
  active,
  className,
}: {
  active?: boolean
  className?: string
}) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="7"
        cy="7"
        r={active ? 5 : 3.5}
        stroke="var(--museum-brass)"
        strokeWidth="1"
        fill={active ? 'var(--museum-brass)' : 'transparent'}
        opacity={active ? 1 : 0.45}
      />
    </svg>
  )
}
