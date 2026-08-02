import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { useLang } from '@/context/LangContext'
import { cubeProjects } from './cube-data'
import AssociativeField from './field/AssociativeField'
import MemoryFormula from './MemoryFormula'
import { ZEN } from '@/lib/motion'

/** Hover drift: a soft spring pull, not a tween — the row leans toward the hand. */
const LEAN = { type: 'spring', stiffness: 320, damping: 24 } as const

/**
 * The works wall, redrawn as mathematics: a UGAF associative field (monotonic
 * expansion, bounded propagation, one governed Select_Γ) beside a pure-text
 * project index — no images. Hovering an index row lights its anchor node.
 * The formula band below is the same pipeline, typeset.
 */
export default function FieldSection() {
  const { t, lang } = useLang()
  const reduce = useReducedMotion()
  const [highlight, setHighlight] = useState<string | null>(null)

  /** do-it leads — the process work is the front door. */
  const ORDER = ['do-it', 'alaya', 'write-right', 'sentinel', 'vegetarian'] as const
  const projects = ORDER.map((id) => cubeProjects.find((p) => p.id === id)!)

  return (
    <section id="works" className="mx-auto max-w-shell scroll-mt-20 px-6 py-24 md:px-10 md:py-36">
      <header className="mb-12 md:mb-16">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-museum-muted">
          {t.works.label}
        </p>
        <h2 className="mt-4 font-display text-h2 font-semibold text-museum-ink">
          {t.works.heading}
        </h2>
      </header>

      <div className="grid grid-cols-1 items-center gap-y-12 lg:grid-cols-12 lg:gap-x-14">
        {/* the field — a warm pane, softly rounded, lifted slightly out of the row */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 1.1, ease: ZEN }}
          className="lg:col-span-7 lg:-mt-10"
        >
          <div className="overflow-hidden rounded-[28px] bg-paper-warm shadow-[0_28px_70px_-36px_rgba(90,64,38,0.35)] ring-1 ring-clay/[0.12]">
            <AssociativeField variant="section" highlight={highlight} className="w-full" />
          </div>
        </motion.div>

        {/* the index — whitespace instead of hairlines, ghost numerals, spring lean */}
        <ol className="lg:col-span-5">
          {projects.map((project, order) => {
            const statement = lang === 'zh' ? project.statementZh : project.statementEn
            const cta = lang === 'zh' ? project.ctaZh : project.ctaEn

            const inner = (
              <motion.div
                whileHover={reduce ? undefined : { x: 10 }}
                whileFocus={reduce ? undefined : { x: 10 }}
                transition={LEAN}
                className="flex items-start gap-5 py-6 md:gap-7"
              >
                <span
                  aria-hidden="true"
                  className="mt-1 shrink-0 font-display text-4xl font-light italic leading-none text-ink/[0.14] transition-colors duration-500 group-hover:text-cobalt/60 md:text-5xl"
                >
                  {String(order + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="truncate font-display text-xl font-semibold leading-snug text-museum-ink transition-colors duration-300 group-hover:text-cobalt md:text-2xl">
                      {project.title}
                    </h3>
                    <span className="flex shrink-0 items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-museum-muted transition-colors duration-300 group-hover:text-cobalt">
                      {cta}
                      <ArrowUpRight
                        className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                        strokeWidth={1.5}
                        aria-hidden="true"
                      />
                    </span>
                  </div>
                  <p className="mt-2 max-w-[46ch] text-[14px] leading-relaxed text-museum-muted">
                    {statement}
                  </p>
                  {project.tags.length > 0 && (
                    <p className="mt-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
                      {project.tags.join(' · ')}
                    </p>
                  )}
                </div>
              </motion.div>
            )

            const rowProps = {
              className: 'group block rounded-2xl outline-offset-4',
              onMouseEnter: () => setHighlight(project.id),
              onMouseLeave: () => setHighlight(null),
              onFocus: () => setHighlight(project.id),
              onBlur: () => setHighlight(null),
            }

            return (
              <motion.li
                key={project.id}
                initial={reduce ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.6, ease: ZEN, delay: reduce ? 0 : order * 0.06 }}
              >
                {project.route ? (
                  <Link to={project.route} {...rowProps}>
                    {inner}
                  </Link>
                ) : (
                  <a href={project.github} target="_blank" rel="noreferrer" {...rowProps}>
                    {inner}
                  </a>
                )}
              </motion.li>
            )
          })}
        </ol>
      </div>

      {/* the mathematics of memory — freed from the pane, set full width */}
      <MemoryFormula />
    </section>
  )
}
