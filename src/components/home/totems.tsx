import { memo } from 'react'

/**
 * Project totems — perpetual loop animations, isolated + memoized.
 * `playing` gates the loop (started on scroll-enter, paused on leave);
 * `fast` runs the loop at 1.5× while the card is hovered.
 */
type TotemProps = { playing: boolean; fast: boolean }

function playProps(base: number, { playing, fast }: TotemProps) {
  return {
    animationDuration: `${fast ? base / 1.5 : base}s`,
    animationPlayState: playing ? ('running' as const) : ('paused' as const),
  }
}

/* —— do-it: four dots light up along the route; VERIFIED stamp lands every 4s —— */
export const DoItTotem = memo(function DoItTotem(props: TotemProps) {
  const nodes: [number, number, string][] = [
    [40, 150, 'ROUTE'],
    [120, 88, 'DELEGATE'],
    [200, 130, 'PROVE'],
    [280, 60, 'LEARN'],
  ]
  return (
    <div className="relative">
      <style>{`
        @keyframes doit-dot {
          0%, 100% { opacity: 0.25; transform: scale(1); }
          12%, 30% { opacity: 1; transform: scale(1.35); }
        }
        @keyframes doit-stamp {
          0% { opacity: 0; transform: scale(1.7) rotate(-10deg); }
          7% { opacity: 1; transform: scale(1) rotate(-4deg); }
          80% { opacity: 1; transform: scale(1) rotate(-4deg); }
          90%, 100% { opacity: 0; transform: scale(1) rotate(-4deg); }
        }
      `}</style>
      <svg viewBox="0 0 360 190" className="h-auto w-[320px] max-w-full" role="img" aria-label="Route → Delegate → Prove → Learn">
        <polyline
          points={nodes.map(([x, y]) => `${x},${y}`).join(' ')}
          fill="none"
          stroke="var(--clay)"
          strokeWidth={1.5}
          opacity={0.45}
          strokeDasharray="4 5"
        />
        {nodes.map(([x, y, label], i) => (
          <g key={label}>
            <circle cx={x} cy={y} r={14} fill="none" stroke="var(--clay)" strokeWidth={1} opacity={0.35} />
            <circle
              cx={x}
              cy={y}
              r={6}
              fill="var(--clay)"
              style={{
                transformBox: 'fill-box',
                transformOrigin: 'center',
                animation: `doit-dot 4s ease-in-out infinite`,
                animationDelay: `${i * 1}s`,
                ...playProps(4, props),
              }}
            />
            <text
              x={x}
              y={y + 32}
              textAnchor="middle"
              fontFamily="'IBM Plex Mono', monospace"
              fontSize={9}
              letterSpacing={1.5}
              fill="var(--faint)"
            >
              {label}
            </text>
          </g>
        ))}
        <g
          style={{
            transformBox: 'fill-box',
            transformOrigin: 'center',
            animation: 'doit-stamp 4s cubic-bezier(0.34, 1.56, 0.64, 1) infinite',
            ...playProps(4, props),
          }}
        >
          <rect x={292} y={18} width={62} height={24} rx={3} fill="none" stroke="var(--seal)" strokeWidth={1.5} transform="rotate(-4 323 30)" />
          <text
            x={323}
            y={34}
            textAnchor="middle"
            fontFamily="'IBM Plex Mono', monospace"
            fontSize={9}
            fontWeight={500}
            letterSpacing={1}
            fill="var(--seal)"
            transform="rotate(-4 323 30)"
          >
            VERIFIED
          </text>
        </g>
      </svg>
    </div>
  )
})

/* —— Alaya: six-petal ring, one petal lit; center gate breathes —— */
export const AlayaTotem = memo(function AlayaTotem(props: TotemProps) {
  const petals = Array.from({ length: 6 }, (_, i) => i * 60)
  return (
    <svg viewBox="0 0 200 200" className="h-auto w-[200px] max-w-full" role="img" aria-label="Memory lifecycle">
      <g
        className="animate-ring-rotate"
        style={{ transformOrigin: '100px 100px', ...playProps(60, props) }}
      >
        {petals.map((deg, i) => (
          <ellipse
            key={deg}
            cx={100}
            cy={44}
            rx={15}
            ry={27}
            transform={`rotate(${deg} 100 100)`}
            fill={i === 0 ? 'var(--moss)' : 'none'}
            fillOpacity={i === 0 ? 0.85 : undefined}
            stroke={i === 0 ? 'none' : 'var(--ink-3)'}
            strokeOpacity={i === 0 ? undefined : 0.4}
            strokeWidth={1}
          />
        ))}
      </g>
      {/* breathing gate */}
      <rect
        x={89}
        y={89}
        width={22}
        height={22}
        fill="none"
        stroke="var(--moss)"
        strokeWidth={1.5}
        className="animate-gate-breath"
        style={{ transformOrigin: '100px 100px', ...playProps(4.8, props) }}
      />
      <circle cx={100} cy={100} r={2.5} fill="var(--ink)" />
    </svg>
  )
})

/* —— Write-Right: 4×3 movable-type grid, cells press down and release —— */
const GENRES = ['请示', '报告', '通知', '公函', '讲话', '总结', '方案', '纪要', '致辞', '批复', '决定', '通报']

export const WriteRightTotem = memo(function WriteRightTotem(props: TotemProps) {
  return (
    <div className="grid w-[260px] max-w-full grid-cols-4 gap-2" role="img" aria-label="Genres">
      {GENRES.map((g, i) => (
        <span
          key={g}
          className="animate-type-press grid h-14 place-items-center rounded-md border border-hairline bg-paper-deep/70 font-serif text-base text-ink-2"
          style={{
            animationDelay: `${((i * 7) % 12) * 0.31}s`,
            ...playProps(2.6 + (i % 3) * 0.4, props),
          }}
        >
          {g}
        </span>
      ))}
    </div>
  )
})
