import { useId, type ReactNode } from 'react'

/**
 * A 35mm cartridge seen from a little above, drawn after photographs of the
 * real thing: black end caps and spool, the velvet lip, the brown leader cut
 * into its tongue, and the label in the colors its kind of film is known by,
 * with the name running up the side. No maker's marks, no film speed.
 */

/**
 * Label space: the front of the body, x 32–108, y 42–164. Names read upward
 * between the top cap and the tape (y 46–144).
 */
type Label = (name: string, maker: string) => ReactNode
const mid = 95
const up = (x: number) => `rotate(-90 ${x} ${mid})`

function Name({ x, fill, size = 30, children }: { x: number; fill: string; size?: number; children: string }) {
  return (
    <text
      x={x}
      y={mid}
      transform={up(x)}
      textAnchor="middle"
      fill={fill}
      className="a-canister-name"
      fontSize={size}
      textLength={Math.min(94, children.length * size * 0.5)}
      lengthAdjust="spacingAndGlyphs"
    >
      {children}
    </text>
  )
}
function Maker({ x, fill, children }: { x: number; fill: string; children: string }) {
  return children ? (
    <text x={x} y={mid} transform={up(x)} textAnchor="middle" fill={fill} className="a-canister-maker">
      {children}
    </text>
  ) : null
}

const labels: [RegExp, string, Label][] = [
  // black and white
  [/tri-?x|t-?max|double-?x/i, '#f2c12e', (name, maker) => (
    <>
      <rect x="32" y="42" width="20" height="122" fill="#151515" />
      <Maker x={46} fill="#f2c12e">{maker}</Maker>
      <Name x={88} fill="#151515" size={34}>{name}</Name>
    </>
  )],
  [/ilford|hp-?5|fp-?4|delta|\bpan\b|kentmere|b\s*&\s*w|\bbw\b|黑白/i, '#161616', (name, maker) => (
    <>
      <rect x="32" y="42" width="76" height="5" fill="#f4f1ea" />
      <rect x="32" y="159" width="76" height="5" fill="#f4f1ea" />
      <Maker x={48} fill="#f4f1ea">{maker}</Maker>
      <Name x={88} fill="#f3d22c" size={34}>{name}</Name>
    </>
  )],
  // color
  [/portra|ektar/i, '#efa520', (name, maker) => (
    <>
      <rect x="32" y="42" width="36" height="122" fill="#151515" />
      <Name x={62} fill="#f4f1ea" size={28}>{name}</Name>
      <Maker x={88} fill="#151515">{maker}</Maker>
    </>
  )],
  [/fuji|superia|c200|pro\s*400h|velvia|provia|xtra/i, '#1f9a4e', (name, maker) => (
    <>
      <rect x="32" y="42" width="18" height="122" fill="#f4f1ea" />
      <Maker x={45} fill="#1f9a4e">{maker}</Maker>
      <Name x={88} fill="#f4f1ea" size={32}>{name}</Name>
    </>
  )],
  [/cine|vision/i, '#2e3135', (name, maker) => (
    <>
      <rect x="32" y="42" width="16" height="122" fill="#d8402a" />
      <Name x={86} fill="#efebe3" size={30}>{name}</Name>
      <Maker x={44} fill="#efebe3">{maker}</Maker>
    </>
  )],
  [/gold|ultra-?max|color-?plus|kodak|pro\s*image/i, '#f5b41b', (name, maker) => (
    <>
      <rect x="38" y="42" width="16" height="122" fill="#d2232a" />
      <Maker x={50} fill="#f5b41b">{maker}</Maker>
      <Name x={90} fill="#2a1408" size={34}>{name}</Name>
    </>
  )],
]

const makers = /^(kodak|fujifilm|fuji|ilford|harman|kentmere|cinestill|agfa|lomography|foma|rollei)\b/i

/** "Kodak Gold 200" → maker "KODAK", name "GOLD": the speed is left off. */
function split(stock: string) {
  const bare = stock.replace(/\b(iso\s*)?\d{2,4}\b/gi, '').replace(/\s+/g, ' ').trim()
  const maker = bare.match(makers)?.[0] ?? ''
  const name = bare.slice(maker.length).trim() || bare
  return { maker: maker.toUpperCase(), name: name.toUpperCase() }
}

export function Canister({ stock, tape, open = false }: { stock?: string; tape: string; open?: boolean }) {
  const id = useId().replace(/:/g, '')
  const found = stock ? labels.find(([test]) => test.test(stock)) : undefined
  const { maker, name } = stock ? split(stock) : { maker: '', name: '' }
  const body = found?.[1] ?? '#c3c6c9'
  return (
    <svg className="a-canister" viewBox="0 0 180 200" data-open={open ? '' : undefined} aria-hidden="true">
      <defs>
        <clipPath id={`${id}-body`}>
          <path d="M32 40H108V170A38 10 0 0 1 32 170Z" />
        </clipPath>
        <linearGradient id={`${id}-round`} x1="0" x2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.5" />
          <stop offset="0.12" stopColor="#000" stopOpacity="0.12" />
          <stop offset="0.3" stopColor="#fff" stopOpacity="0.3" />
          <stop offset="0.42" stopColor="#fff" stopOpacity="0.04" />
          <stop offset="0.75" stopColor="#000" stopOpacity="0.08" />
          <stop offset="1" stopColor="#000" stopOpacity="0.58" />
        </linearGradient>
        <linearGradient id={`${id}-metal`} x1="0" x2="1">
          <stop offset="0" stopColor="#0c0c0c" />
          <stop offset="0.32" stopColor="#4a4a4a" />
          <stop offset="0.5" stopColor="#1c1c1c" />
          <stop offset="1" stopColor="#080808" />
        </linearGradient>
        <linearGradient id={`${id}-film`} x1="0" x2="1">
          <stop offset="0" stopColor="#3a1f0e" />
          <stop offset="0.35" stopColor="#7b4521" />
          <stop offset="1" stopColor="#5a3015" />
        </linearGradient>
      </defs>

      {/* the leader, curling out of the lip */}
      <g className="a-canister-leader">
        <path
          d="M114 62C130 58 150 57 166 60Q174 62 173 72L171 100Q160 101 150 103C146 118 140 136 136 150L114 152Z"
          fill={`url(#${id}-film)`}
          opacity="0.96"
        />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect key={`t${i}`} x={120 + i * 8} y={64 - i * 0.3} width="4" height="5" rx="1" fill="#120a05" />
        ))}
        {[0, 1].map((i) => (
          <rect key={`b${i}`} x={119 + i * 8} y="141" width="4" height="5" rx="1" fill="#120a05" />
        ))}
        <path d="M114 62C130 58 150 57 166 60" stroke="#c48a55" strokeOpacity="0.35" fill="none" />
      </g>

      {/* body and label */}
      <g clipPath={`url(#${id}-body)`}>
        <rect x="30" y="38" width="80" height="140" fill={body} />
        {found?.[2](name, maker)}
        <rect x="30" y="38" width="80" height="140" fill={`url(#${id}-round)`} />
        <rect x="50" y="38" width="3" height="140" fill="#fff" opacity="0.22" />
      </g>
      {/* the velvet lip the film comes through */}
      <path d="M105 46L116 49V158L105 162Z" fill="#141414" />
      <path d="M113 52V156" stroke="#3a3a3a" strokeWidth="1.5" />

      {/* end caps */}
      <path d="M31 163H109V172A39 10 0 0 1 31 172Z" fill={`url(#${id}-metal)`} />
      <rect x="31" y="31" width="78" height="10" fill={`url(#${id}-metal)`} />
      <ellipse cx="70" cy="41" rx="39" ry="10" fill={`url(#${id}-metal)`} />
      <ellipse cx="70" cy="31" rx="39" ry="10" fill="#202020" />
      <ellipse cx="70" cy="31" rx="35" ry="8.4" fill="none" stroke="#3c3c3c" strokeWidth="1.2" />
      {/* the spool, standing out of the top cap */}
      <rect x="59" y="19" width="22" height="12" fill={`url(#${id}-metal)`} />
      <ellipse cx="70" cy="31" rx="11" ry="3" fill="#0a0a0a" />
      <ellipse cx="70" cy="19" rx="11" ry="3" fill="#2f2f2f" />
      <ellipse cx="70" cy="19" rx="5.5" ry="1.5" fill="#050505" />

      {/* the photographer's own note */}
      <g transform="rotate(-3 70 155)">
        <rect x="30" y="146" width="80" height="18" fill="#efe2c2" opacity="0.95" />
        <text x="70" y="159" textAnchor="middle" className="a-canister-tape">
          {tape}
        </text>
      </g>
    </svg>
  )
}
