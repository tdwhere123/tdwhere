import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import type { Lang } from '@/context/LangContext'
import { cn } from '@/lib/utils'
import type { CubeProject } from './cube-data'
import ScrollHintMark from './svg/ScrollHintMark'

const ZEN = [0.22, 1, 0.36, 1] as [number, number, number, number]

type Props = {
  project: CubeProject
  lang: Lang
  showScrollHint: boolean
  /** Tighter vertical rhythm for the mobile stacked layout. */
  compact?: boolean
}

export default function ProjectInfo({ project, lang, showScrollHint, compact = false }: Props) {
  const category = lang === 'zh' ? project.categoryZh : project.categoryEn
  const statement = lang === 'zh' ? project.statementZh : project.statementEn
  const description = lang === 'zh' ? project.descriptionZh : project.descriptionEn
  const cta = lang === 'zh' ? project.ctaZh : project.ctaEn

  return (
    <div className={cn('relative', compact ? 'min-h-0' : 'min-h-[280px] md:min-h-[340px]')}>
      <AnimatePresence mode="wait">
        <motion.div
          key={project.id}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.45, ease: ZEN }}
          className="flex flex-col"
        >
          <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-museum-muted md:text-[13px]">
            {project.shortName} · {category}
          </p>

          <h2
            className={cn(
              'font-serif font-semibold leading-[1.1] text-museum-ink',
              compact
                ? 'mt-3 text-[28px]'
                : 'mt-4 text-[32px] md:text-[clamp(48px,5vw,64px)]',
            )}
          >
            {project.title}
          </h2>

          <p
            className={cn(
              'max-w-md font-serif leading-snug text-ink-2',
              compact ? 'mt-3 text-[17px]' : 'mt-5 text-[18px] md:text-[22px]',
            )}
          >
            {statement}
          </p>

          <p
            className={cn(
              'max-w-md leading-relaxed text-museum-muted',
              compact ? 'mt-3 text-[14px]' : 'mt-4 text-[14px] md:text-[16px]',
            )}
          >
            {description}
          </p>

          {project.tags.length > 0 && (
            <p
              className={cn(
                'font-mono uppercase tracking-[0.12em] text-museum-brass',
                compact ? 'mt-4 text-[11px]' : 'mt-6 text-[11px] md:text-[12px]',
              )}
            >
              {project.tags.join(' · ')}
            </p>
          )}

          <div className={cn('flex flex-wrap items-center gap-5', compact ? 'mt-5' : 'mt-8')}>
            {project.id === 'home' ? (
              showScrollHint && (
                <div className="flex items-center gap-3 text-museum-muted">
                  <ScrollHintMark />
                  <div className="font-mono text-[11px] uppercase tracking-[0.14em]">
                    <div>{cta}</div>
                    <div className="mt-1 hidden opacity-70 md:block">WASD / ARROWS</div>
                  </div>
                </div>
              )
            ) : project.route ? (
              <>
                <Link
                  to={project.route}
                  className="group relative inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-museum-ink transition-transform duration-300 ease-zen hover:translate-x-1"
                  data-cursor="hover"
                >
                  {cta}
                  <span aria-hidden="true">↗</span>
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-1 left-0 h-px w-0 bg-museum-brass transition-all duration-300 ease-zen group-hover:w-full"
                  />
                </Link>
                {project.github && (
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-xs uppercase tracking-[0.14em] text-museum-muted transition-colors hover:text-museum-ink"
                  >
                    GITHUB ↗
                  </a>
                )}
              </>
            ) : project.github ? (
              <a
                href={project.github}
                target="_blank"
                rel="noreferrer"
                className="group relative inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-museum-ink transition-transform duration-300 ease-zen hover:translate-x-1"
                data-cursor="hover"
              >
                {cta}
                <span aria-hidden="true">↗</span>
                <span
                  aria-hidden="true"
                  className="absolute -bottom-1 left-0 h-px w-0 bg-museum-brass transition-all duration-300 ease-zen group-hover:w-full"
                />
              </a>
            ) : null}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
