import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useLang } from '@/context/LangContext'
import { writeRightContent } from '@/content/writeRight'
import Kicker from '@/components/Kicker'
import { cn } from '@/lib/utils'
import { ZEN } from '@/lib/motion'


const BACK = [0.34, 1.56, 0.64, 1] as [number, number, number, number]

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
  reduced,
}: {
  label: string
  options: Option[]
  value: string
  onChange: (id: string) => void
  reduced: boolean
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
              initial={reduced ? false : { y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.4, ease: ZEN, delay: reduced ? 0 : i * 0.05 }}
              className={cn(
                'rounded-[4px] border px-3.5 py-2 font-display text-sm transition-all duration-200 ease-zen',
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
 * 路由解析带 · Route resolution ribbon — the three chosen tiles press in one
 * by one while cobalt connectors draw themselves between them. Re-runs on
 * every selection change. Mobile (<sm): connectors collapse to × separators,
 * selectors stay tap-based. Reduced motion: static final state.
 */
function RouteRibbon({
  labels,
  routeKey,
  reduced,
}: {
  labels: [string, string, string]
  routeKey: string
  reduced: boolean
}) {
  const chipV = {
    hidden: { y: -14, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { duration: 0.4, ease: BACK } },
  }
  const lineV = {
    hidden: { scaleX: 0 },
    show: { scaleX: 1, transition: { duration: 0.35, ease: ZEN, delay: 0.08 } },
  }
  const chipCls = cn(
    'inline-flex items-center rounded-[4px] border border-dai px-3 py-1.5 font-display text-sm text-ink',
    'bg-[color-mix(in_srgb,var(--dai)_9%,var(--museum-bg))]',
    TILE_SHADOW,
  )
  return (
    <motion.div
      key={routeKey}
      className="flex flex-wrap items-center gap-x-1 gap-y-2"
      initial={reduced ? false : 'hidden'}
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.18, delayChildren: 0.05 } },
      }}
      aria-label={labels.join(' × ')}
    >
      <motion.span variants={chipV} className={chipCls}>
        {labels[0]}
      </motion.span>
      {[1, 2].map((idx) => (
        /* connector wraps together with its tile, so a line never dangles */
        <motion.span key={idx} variants={chipV} className="flex items-center gap-2">
          <motion.span
            aria-hidden="true"
            variants={lineV}
            className="hidden h-px w-8 origin-left bg-cobalt sm:block"
          />
          <span aria-hidden="true" className="px-1 font-mono text-xs leading-none text-faint sm:hidden">
            ×
          </span>
          <span className={chipCls}>{labels[idx]}</span>
        </motion.span>
      ))}
    </motion.div>
  )
}

/**
 * S3 · 【核心交互】文种路由器 — genre × setting × goal → a choose-your-own
 * skeleton on a metal grid sheet. Every pick re-runs the route resolution:
 * the ribbon re-draws, the skeleton re-flips in, the goal focus marks itself
 * in cobalt. Default: 请示 × 上行 × 争取支持.
 */
export default function GenreRouter() {
  const { lang } = useLang()
  const c = writeRightContent[lang].router
  const reduced = useReducedMotion() ?? false

  const [genre, setGenre] = useState('qingshi')
  const [setting, setSetting] = useState('up')
  const [goal, setGoal] = useState('support')

  const skeleton = c.skeletons[genre] ?? []
  const focusIdx = c.goalFocus[genre]?.[goal] ?? -1
  const genreLabel = c.genres.find((g) => g.id === genre)?.label ?? ''
  const settingLabel = c.settings.find((s) => s.id === setting)?.label ?? ''
  const goalLabel = c.goals.find((g) => g.id === goal)?.label ?? ''
  const tone = (c.tones as Record<string, string>)[setting] ?? ''

  /* any pick re-resolves the whole route */
  const routeKey = `${genre}-${setting}-${goal}-${lang}`
  /* focus marker lands after the skeleton stagger finishes */
  const focusDelay = reduced ? 0 : 0.25 + skeleton.length * 0.06

  return (
    <section
      id="genre-router"
      className="mx-auto max-w-shell scroll-mt-20 px-5 py-[clamp(72px,12vh,128px)] md:px-10"
    >
      <motion.div
        initial={reduced ? false : { y: 40, opacity: 0, filter: 'blur(8px)' }}
        whileInView={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.9, ease: ZEN }}
        className="mx-auto max-w-demo"
      >
        <Kicker>{c.kicker}</Kicker>
        <h2 className="mt-4 font-display text-h2 font-semibold text-ink">{c.title}</h2>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.05fr]">
          {/* ——— three selectors ——— */}
          <div className="space-y-8">
            <SelectorGroup
              label={c.genreLabel}
              options={c.genres}
              value={genre}
              onChange={setGenre}
              reduced={reduced}
            />
            <SelectorGroup
              label={c.settingLabel}
              options={c.settings}
              value={setting}
              onChange={setSetting}
              reduced={reduced}
            />
            <SelectorGroup
              label={c.goalLabel}
              options={c.goals}
              value={goal}
              onChange={setGoal}
              reduced={reduced}
            />

            <div className="min-h-[2rem]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={`${setting}-${lang}`}
                  className="font-mono text-xs leading-relaxed text-faint"
                  initial={reduced ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                  transition={{ duration: 0.3, ease: ZEN }}
                >
                  {tone}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>

          {/* ——— the skeleton sheet (稿纸 → metal grid) ——— */}
          <div
            className="relative border border-museum-line bg-museum-stone/55 p-6 md:p-8"
            style={{ backgroundImage: SHEET_GRID, backgroundSize: '36px 36px' }}
          >
            {/* route resolution ribbon */}
            <RouteRibbon
              labels={[genreLabel, settingLabel, goalLabel]}
              routeKey={routeKey}
              reduced={reduced}
            />

            <AnimatePresence mode="wait">
              <motion.ol
                key={routeKey}
                className="mt-6 min-h-[300px] space-y-3.5"
                initial={reduced ? false : 'hidden'}
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
                        'relative flex items-baseline gap-3 px-2 py-1.5 -mx-2 transition-colors duration-300',
                        focus && 'bg-[color-mix(in_srgb,var(--dai)_9%,transparent)]',
                      )}
                    >
                      {/* cobalt focus bracket draws itself once the list settles */}
                      {focus && (
                        <motion.span
                          aria-hidden="true"
                          className="absolute left-0 top-0 h-full w-[2px] origin-top bg-cobalt"
                          initial={reduced ? false : { scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          transition={{ duration: 0.35, ease: ZEN, delay: focusDelay }}
                        />
                      )}
                      {/* serial — pressed type tile */}
                      <motion.span
                        aria-hidden="true"
                        initial={reduced ? false : { y: -2 }}
                        animate={{ y: 0 }}
                        transition={{ duration: 0.3, ease: ZEN, delay: 0.05 + i * 0.06 }}
                        className={cn(
                          'inline-grid h-7 w-7 shrink-0 translate-y-1 place-items-center rounded-[4px] border font-mono text-xs',
                          TILE_SHADOW,
                          focus
                            ? 'border-cobalt bg-[color-mix(in_srgb,var(--cobalt)_9%,var(--museum-bg))] text-cobalt'
                            : 'border-museum-line bg-museum-bg text-ink-3',
                        )}
                      >
                        {i + 1}
                      </motion.span>
                      <span className="min-w-0">
                        <span className="font-display text-base font-semibold text-ink">
                          {item.label}
                        </span>
                        {item.hint && (
                          <span className="ml-2.5 text-xs text-faint">{item.hint}</span>
                        )}
                        {focus && (
                          <motion.span
                            initial={reduced ? false : { scale: 0.7, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.35, ease: BACK, delay: focusDelay + 0.1 }}
                            className="ml-2.5 inline-block border border-cobalt/50 px-2 py-px align-middle font-mono text-[10px] text-cobalt"
                          >
                            {c.highlightNote}
                          </motion.span>
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
