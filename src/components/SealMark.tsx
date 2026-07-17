/**
 * Inline 阿黄 white-character seal (mirrors /seal-ahuang.svg).
 * Inlined so the characters use the loaded Noto Serif SC webfont.
 */
export default function SealMark({
  size = 64,
  className,
}: {
  size?: number
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 400 400"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="阿黄 seal"
    >
      <defs>
        <filter id="seal-worn-c" x="-6%" y="-6%" width="112%" height="112%">
          <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="3" seed="11" result="n" />
          <feColorMatrix
            in="n"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.4 1.4 1.4 0 -2.1"
            result="speck"
          />
          <feComposite in="SourceGraphic" in2="speck" operator="out" />
        </filter>
        <filter id="seal-rough-c" x="-6%" y="-6%" width="112%" height="112%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="4" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="9" />
        </filter>
      </defs>
      <g transform="rotate(-1.5 200 200)">
        <g filter="url(#seal-rough-c)">
          <g filter="url(#seal-worn-c)">
            <path
              d="M 58 62 Q 200 52 342 60 Q 350 200 344 340 Q 200 350 56 342 Q 50 200 58 62 Z"
              fill="#8F4A32"
            />
            <path
              d="M 84 88 Q 200 80 316 86 Q 322 200 318 314 Q 200 322 82 316 Q 78 200 84 88 Z"
              fill="none"
              stroke="#E9E4D9"
              strokeWidth="5"
              opacity="0.85"
            />
            <text
              x="200"
              y="196"
              textAnchor="middle"
              fontFamily="'Noto Serif SC','Songti SC',serif"
              fontWeight="700"
              fontSize="112"
              fill="#E9E4D9"
            >
              阿
            </text>
            <text
              x="200"
              y="308"
              textAnchor="middle"
              fontFamily="'Noto Serif SC','Songti SC',serif"
              fontWeight="700"
              fontSize="112"
              fill="#E9E4D9"
            >
              黄
            </text>
          </g>
        </g>
      </g>
    </svg>
  )
}
