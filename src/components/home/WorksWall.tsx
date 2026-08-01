import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { useLang } from '@/context/LangContext'
import { cubeProjects, type CubeProject } from './cube-data'
import { cn } from '@/lib/utils'
import { ZEN } from '@/lib/motion'


type CellLayout = {
  id: CubeProject['id']
  span: string
  aspect: string
}

/** Asymmetric editorial rhythm: one full-width lead, then offset 4:3 vs 16:10 pairs. */
const LAYOUT: CellLayout[] = [
  { id: 'alaya', span: 'md:col-span-12', aspect: 'aspect-[16/9]' },
  { id: 'do-it', span: 'md:col-span-7', aspect: 'aspect-[4/3]' },
  { id: 'write-right', span: 'md:col-span-5 md:mt-24', aspect: 'aspect-[16/10]' },
  { id: 'sentinel', span: 'md:col-span-5', aspect: 'aspect-[16/10]' },
  { id: 'vegetarian', span: 'md:col-span-7 md:mt-16', aspect: 'aspect-[4/3]' },
]

function WorkCard({
  project,
  layout,
  order,
}: {
  project: CubeProject
  layout: CellLayout
  order: number
}) {
  const { lang } = useLang()
  const reduce = useReducedMotion()
  const statement = lang === 'zh' ? project.statementZh : project.statementEn
  const cta = lang === 'zh' ? project.ctaZh : project.ctaEn

  const inner = (
    <>
      <div className={cn('overflow-hidden bg-museum-stone', layout.aspect)}>
        <img
          src={project.image}
          alt={project.alt}
          loading={order === 0 ? 'eager' : 'lazy'}
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-700 ease-zen group-hover:scale-[1.03]"
        />
      </div>
      <div className="mt-5">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="font-display text-[22px] font-semibold leading-tight text-museum-ink md:text-2xl">
            {project.title}
          </h3>
          <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.14em] text-museum-muted transition-colors duration-300 group-hover:text-cobalt">
            {cta} ↗
          </span>
        </div>
        <span
          aria-hidden="true"
          className="mt-3 block h-[2px] w-full origin-left scale-x-0 bg-cobalt transition-transform duration-500 ease-zen group-hover:scale-x-100"
        />
        <p className="mt-3 text-[15px] leading-relaxed text-museum-muted">{statement}</p>
        {project.tags.length > 0 && (
          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.12em] text-faint">
            {project.tags.join(' · ')}
          </p>
        )}
      </div>
    </>
  )

  const className = cn('group block', layout.span)

  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, ease: ZEN, delay: reduce ? 0 : order * 0.08 }}
      className={className}
    >
      {project.route ? (
        <Link to={project.route} className="block">
          {inner}
        </Link>
      ) : (
        <a href={project.github} target="_blank" rel="noreferrer" className="block">
          {inner}
        </a>
      )}
    </motion.article>
  )
}

export default function WorksWall() {
  const { t } = useLang()
  const projects = LAYOUT.map((layout) => ({
    layout,
    project: cubeProjects.find((p) => p.id === layout.id)!,
  }))

  return (
    <section id="works" className="mx-auto max-w-shell scroll-mt-20 px-6 py-24 md:px-10 md:py-36">
      <header className="mb-14 md:mb-20">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-museum-muted">
          {t.works.label}
        </p>
        <h2 className="mt-4 font-display text-h2 font-semibold text-museum-ink">
          {t.works.heading}
        </h2>
      </header>

      <div className="grid grid-cols-1 gap-y-16 md:grid-cols-12 md:gap-x-10 md:gap-y-24">
        {projects.map(({ layout, project }, index) => (
          <WorkCard key={project.id} project={project} layout={layout} order={index} />
        ))}
      </div>
    </section>
  )
}
