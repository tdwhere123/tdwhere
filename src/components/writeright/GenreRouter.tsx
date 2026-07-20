import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLang } from '@/context/LangContext'
import { writeRightContent } from '@/content/writeRight'
import Kicker from '@/components/Kicker'
import { cn } from '@/lib/utils'

const ZEN = [0.22, 1, 0.36, 1] as [number, number, number, number]

/* cool slate metal grid — aligned with hero (9% dai) */
const SHEET_GRID = `linear-gradient(color-mix(in srgb, var(--dai) 9%, transparent) 1px, transparent 1px),
linear-gradient(90deg, color-mix(in srgb, var(--dai) 9%, transparent) 1px, transparent 1px)`

const PRESS_SHADOW =
  'shadow-[inset_0_1px_3px_color-mix(in_srgb,var(--ink)_16%,transparent)]'
const TILE_SHADOW =
  'shadow-[inset_0_1px_2px_color-mix(in_srgb,var(--ink)_12%,transparent)]'

interface Option {
  id: string
  label: string
}

/** one segmented control of pressed-type tiles (活字牌) */
function SelectorGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: Option[]
  value: string
  onChange: (id: string) => void
}) {
  return (
    <fieldset>
      <legend className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-faint">
        {label}
      </legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((opt, i) => {
          const active = opt.id === value
          return (
            <motion.button
              key={opt.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(opt.id)}
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.4, ease: ZEN, delay: i * 0.05 }}
              className={cn(
                'rounded-[4px] border px-3.5 py-2 font-serif text-sm transition-all duration-200 ease-zen',
                active
                  ? cn(
                      'translate-y-px border-dai bg-[color-mix(in_srgb,var(--dai)_9%,var(--museum-bg))] text-ink',
                      PRESS_SHADOW,
                    )
                  : 'border-museum-line bg-museum-stone/50 text-ink-3 hover:border-dai hover:text-ink',
              )}
            >
              {opt.label}
            </motion.button>
          )
        })}
      </div>
    </fieldset>
  )
}

/**
 * S3 · 【核心交互】文种路由器 — genre × setting × goal → a choose-your-own
 * skeleton on a metal grid sheet. Default: 请示 × 上行 × 争取支持.
 */
export default function GenreRouter() {
  const { lang } = useLang()
  const c = writeRightContent[lang].router

  const [genre, setGenre] = useState('qingshi')
  const [setting, setSetting] = useState('up')
  const [goal, setGoal] = useState('support')

  const skeleton = c.skeletons[genre] ?? []
  const focusIdx = c.goalFocus[genre]?.[goal] ?? -1
  const genreLabel = c.genres.find((g) => g.id === genre)?.label ?? ''
  const settingLabel = c.settings.find((s) => s.id === setting)?.label ?? ''
  const goalLabel = c.goals.find((g) => g.id === goal)?.label ?? ''
  const tone = (c.tones as Record<string, string>)[setting] ?? ''

  return (
    <section
      id="genre-router"
      className="mx-auto max-w-shell scroll-mt-20 px-5 py-[clamp(72px,12vh,128px)] md:px-10"
    >
      <motion.div
        initial={{ y: 40, opacity: 0, filter: 'blur(8px)' }}
        whileInView={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.9, ease: ZEN }}
        className="mx-auto max-w-demo"
      >
        <Kicker>{c.kicker}</Kicker>
        <h2 className="mt-4 font-serif text-h2 font-semibold text-ink">{c.title}</h2>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.05fr]">
          {/* ——— three selectors ——— */}
          <div className="space-y-8">
            <SelectorGroup label={c.genreLabel} options={c.genres} value={genre} onChange={setGenre} />
            <SelectorGroup
              label={c.settingLabel}
              options={c.settings}
              value={setting}
              onChange={setSetting}
            />
            <SelectorGroup label={c.goalLabel} options={c.goals} value={goal} onChange={setGoal} />

            <p className="font-mono text-xs leading-relaxed text-faint">{tone}</p>
          </div>

          {/* ——— the skeleton sheet (稿纸 → metal grid) ——— */}
          <div
            className="relative border border-museum-line bg-museum-stone/55 p-6 md:p-8"
            style={{ backgroundImage: SHEET_GRID, backgroundSize: '36px 36px' }}
          >
            {/* current route */}
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-dai">
              {genreLabel} <span aria-hidden="true">×</span> {settingLabel}{' '}
              <span aria-hidden="true">×</span> {goalLabel}
            </p>

            <AnimatePresence mode="wait">
              <motion.ol
                key={`${genre}-${lang}`}
                className="mt-6 min-h-[300px] space-y-3.5"
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                variants={{
                  hidden: {},
                  show: { transition: { staggerChildren: 0.06 } },
                }}
              >
                {skeleton.map((item, i) => {
                  const focus = i === focusIdx
                  return (
                    <motion.li
                      key={`${genre}-${i}`}
                      variants={{
                        hidden: { y: 14, opacity: 0 },
                        show: { y: 0, opacity: 1, transition: { duration: 0.45, ease: ZEN } },
                      }}
                      className={cn(
                        'flex items-baseline gap-3 px-2 py-1.5 -mx-2 transition-colors duration-300',
                        focus && 'bg-[color-mix(in_srgb,var(--dai)_9%,transparent)]',
                      )}
                    >
                      {/* serial — pressed type tile */}
                      <motion.span
                        aria-hidden="true"
                        initial={{ y: -2 }}
                        animate={{ y: 0 }}
                        transition={{ duration: 0.3, ease: ZEN, delay: 0.05 + i * 0.06 }}
                        className={cn(
                          'inline-grid h-7 w-7 shrink-0 translate-y-1 place-items-center rounded-[4px] border font-mono text-xs',
                          TILE_SHADOW,
                          focus
                            ? 'border-dai bg-[color-mix(in_srgb,var(--dai)_9%,var(--museum-bg))] text-dai'
                            : 'border-museum-line bg-museum-bg text-ink-3',
                        )}
                      >
                        {i + 1}
                      </motion.span>
                      <span className="min-w-0">
                        <span className="font-serif text-base font-semibold text-ink">
                          {item.label}
                        </span>
                        {item.hint && (
                          <span className="ml-2.5 text-xs text-faint">{item.hint}</span>
                        )}
                        {focus && (
                          <span className="ml-2.5 inline-block border border-dai/50 px-2 py-px align-middle font-mono text-[10px] text-dai">
                            {c.highlightNote}
                          </span>
                        )}
                      </span>
                    </motion.li>
                  )
                })}
              </motion.ol>
            </AnimatePresence>

            <p className="mt-6 border-t border-museum-line pt-4 font-mono text-xs text-faint">
              {c.footerNote}
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
