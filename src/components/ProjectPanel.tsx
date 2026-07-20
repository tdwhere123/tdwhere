import { useRef, useState } from 'react'
import type { ComponentType } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import { useLang } from '@/context/LangContext'
import MetaChip from '@/components/MetaChip'
import Stamp from '@/components/Stamp'
import { DoItTotem, AlayaTotem, WriteRightTotem } from '@/components/home/totems'
import type { RoomCard } from '@/content'

const ZEN = [0.22, 1, 0.36, 1] as [number, number, number, number]

const ACCENTS: Record<string, string> = {
  'do-it': 'var(--clay)',
  alaya: 'var(--moss)',
  'write-right': 'var(--dai)',
}

const TOTEMS: Record<string, ComponentType<{ playing: boolean; fast: boolean }>> = {
  'do-it': DoItTotem,
  alaya: AlayaTotem,
  'write-right': WriteRightTotem,
}

/**
 * 三间屋子 ProjectPanel — full-width room card (home S3).
 * Left: index → role → name → slogan → intro → chips → CTA.
 * Right: the project totem (starts in view, 1.5× on hover).
 */
export default function ProjectPanel({ card, index }: { card: RoomCard; index: number }) {
  const { t } = useLang()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.25 })
  const [hovered, setHovered] = useState(false)
  const accent = ACCENTS[card.key] ?? 'var(--tea)'
  const Totem = TOTEMS[card.key]

  return (
    <motion.div
      ref={ref}
      initial={{ y: 48, opacity: 0, filter: 'blur(8px)' }}
      whileInView={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.9, ease: ZEN, delay: index * 0.15 }}
    >
      <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.3, ease: ZEN }}>
        <Link
          to={card.path}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className="group relative grid min-h-[min(78vh,720px)] overflow-hidden rounded-2xl border border-hairline bg-paper transition-colors duration-300 lg:grid-cols-[55fr_45fr]"
          style={{ borderColor: hovered ? accent : undefined }}
        >
          {card.stamp && (
            <span className="absolute right-6 top-6 z-10">
              <Stamp text={card.stamp} />
            </span>
          )}

          {/* totem — on top (shrunk) for mobile */}
          <div className="order-first flex items-center justify-center border-b border-hairline bg-paper-deep/30 px-6 py-8 lg:order-last lg:border-b-0 lg:border-l">
            <div className="scale-[0.62] sm:scale-75 lg:scale-100">
              {Totem && <Totem playing={inView} fast={hovered} />}
            </div>
          </div>

          {/* copy */}
          <div className="flex flex-col justify-center gap-5 p-7 md:p-12">
            <p className="font-mono text-sm text-faint">
              <motion.span
                className="mr-3 inline-block font-serif text-xl text-ink-3"
                initial={{ rotateX: 90, opacity: 0 }}
                whileInView={{ rotateX: 0, opacity: 1 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.7, ease: ZEN, delay: 0.2 + index * 0.15 }}
              >
                {card.indexZh}
              </motion.span>
              / {card.indexNum}
            </p>

            <p className="font-serif text-[clamp(18px,2vw,24px)] font-semibold" style={{ color: accent }}>
              {card.role}
            </p>

            <h3 className="font-serif text-[clamp(34px,4vw,56px)] font-bold leading-tight text-ink">
              {card.name}
            </h3>

            <p className="font-serif text-lg italic text-ink-3">{card.slogan}</p>

            <p className="text-ink-3">
              {card.descA}
              <br />
              {card.descB}
            </p>

            <div className="flex flex-wrap gap-2">
              {card.chips.map((c) => (
                <MetaChip key={c}>{c}</MetaChip>
              ))}
            </div>

            <p className="mt-2 w-fit font-mono text-sm text-ink">
              <span className="relative">
                {t.rooms.cta.replace(' →', '')}
                <span className="ml-1 inline-block transition-transform duration-300 ease-zen group-hover:translate-x-1.5">
                  →
                </span>
                <span
                  aria-hidden="true"
                  className="absolute -bottom-1 left-0 h-px w-0 bg-ink transition-all duration-300 ease-zen group-hover:w-full"
                />
              </span>
            </p>
          </div>
        </Link>
      </motion.div>
    </motion.div>
  )
}
