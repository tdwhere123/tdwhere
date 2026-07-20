import { useState } from 'react'
import { motion } from 'framer-motion'
import { useLang } from '@/context/LangContext'
import { alayaContent } from '@/content/alaya'
import InkReveal from '@/components/InkReveal'
import Kicker from '@/components/Kicker'
import { cn } from '@/lib/utils'

const ZEN = [0.22, 1, 0.36, 1] as [number, number, number, number]

type Sel = { r: number; c: number } | null

/**
 * S3 · The Grammar — 3 layers × 4 axes interactive matrix.
 * Hover/focus reveals each cell's duty; clicking lights the cell's whole axis
 * column (6% moss) — "exactly one axis as its source of truth".
 */
export default function Grammar() {
  const { lang } = useLang()
  const a = alayaContent[lang].grammar
  const [sel, setSel] = useState<Sel>(null)

  const toggle = (r: number, c: number) =>
    setSel((s) => (s && s.r === r && s.c === c ? null : { r, c }))

  const dutyCls = (r: number, c: number) =>
    cn(
      'text-[11px] leading-snug text-faint transition-opacity duration-300',
      sel && sel.r === r && sel.c === c
        ? 'opacity-100'
        : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100',
    )

  return (
    <section className="mx-auto max-w-demo px-5 py-24 md:px-10 md:py-32" aria-label={a.title}>
      <InkReveal amount={0.5}>
        <Kicker>{a.kicker}</Kicker>
      </InkReveal>
      <InkReveal amount={0.4} delay={0.08}>
        <h2 className="mt-6 font-serif text-h2 font-semibold text-ink">{a.title}</h2>
      </InkReveal>

      {/* —— desktop matrix (md+) —— */}
      <div className="mt-12 hidden md:block">
        {/* axis header row */}
        <div className="grid grid-cols-[180px_repeat(4,1fr)] gap-2">
          <span aria-hidden="true" />
          {a.axes.map((ax, c) => (
            <div
              key={ax.en}
              className={cn(
                'rounded-[6px] px-3 py-2 font-mono text-xs uppercase tracking-[0.14em] transition-colors duration-300',
                sel?.c === c ? 'bg-moss/[0.08] text-ink-2' : 'text-faint',
              )}
            >
              {ax.en} <span className="normal-case">{ax.zh}</span>
            </div>
          ))}
        </div>
        {/* layer rows */}
        {a.layers.map((layer, r) => (
          <div key={layer.en} className="mt-2 grid grid-cols-[180px_repeat(4,1fr)] gap-2">
            <div className="flex flex-col justify-center rounded-[6px] px-3 py-2">
              <span className="font-mono text-xs uppercase tracking-[0.12em] text-ink-3">
                {layer.en}
              </span>
              <span className="font-serif text-sm font-semibold text-ink-2">{layer.zh}</span>
            </div>
            {a.cells[r].map((cell, c) => (
              <motion.button
                key={cell.label}
                type="button"
                onClick={() => toggle(r, c)}
                aria-pressed={sel?.r === r && sel?.c === c}
                initial={{ scale: 0.92, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, ease: ZEN, delay: (r * 4 + c) * 0.03 }}
                className={cn(
                  'group flex min-h-[108px] flex-col items-start justify-between gap-2 rounded-[10px] border bg-museum-bg p-3 text-left transition-colors duration-300',
                  sel?.c === c ? 'border-hairline bg-moss/[0.05]' : 'border-hairline',
                  sel?.r === r && sel?.c === c ? 'border-moss/80' : 'hover:border-moss/50',
                )}
              >
                <span className="text-sm font-medium text-ink-2">{cell.label}</span>
                <span className={dutyCls(r, c)}>{cell.duty}</span>
              </motion.button>
            ))}
          </div>
        ))}
      </div>

      {/* —— mobile: per-layer blocks —— */}
      <div className="mt-10 flex flex-col gap-8 md:hidden">
        {a.layers.map((layer, r) => (
          <div key={layer.en}>
            <p className="font-mono text-xs uppercase tracking-[0.12em] text-ink-3">
              {layer.en} <span className="font-serif text-sm normal-case text-ink-2">{layer.zh}</span>
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {a.cells[r].map((cell, c) => (
                <motion.button
                  key={cell.label}
                  type="button"
                  onClick={() => toggle(r, c)}
                  aria-pressed={sel?.r === r && sel?.c === c}
                  initial={{ scale: 0.92, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, ease: ZEN, delay: c * 0.05 }}
                  className={cn(
                    'group flex min-h-[96px] flex-col items-start justify-between gap-1.5 rounded-[10px] border bg-museum-bg p-3 text-left transition-colors duration-300',
                    sel?.r === r && sel?.c === c
                      ? 'border-moss/80 bg-moss/[0.05]'
                      : 'border-hairline',
                  )}
                >
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
                    {a.axes[c].en}
                  </span>
                  <span className="text-sm font-medium text-ink-2">{cell.label}</span>
                  <span className={dutyCls(r, c)}>{cell.duty}</span>
                </motion.button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 font-mono text-xs text-faint">{a.hint}</p>

      {/* invariant strip — ink reveal + 4px moss edge growing */}
      <InkReveal amount={0.5} className="mt-8">
        <div className="relative overflow-hidden rounded-[6px] border border-hairline bg-museum-bg-deep/60 px-5 py-4">
          <motion.span
            aria-hidden="true"
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.5, ease: ZEN }}
            className="absolute inset-y-0 left-0 w-1 origin-top bg-moss"
          />
          <p className="pl-2 font-mono text-xs leading-relaxed text-ink-2 md:text-sm">
            {a.invariant}
          </p>
        </div>
      </InkReveal>
    </section>
  )
}
