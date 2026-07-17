import { cubeProjects, type CubeStageId } from './cube-data'
import StageTick from './svg/StageTick'
import { cn } from '@/lib/utils'

type Props = {
  activeId: CubeStageId
  onSelect: (index: number) => void
}

export default function CubeNavigation({ activeId, onSelect }: Props) {
  return (
    <nav
      className="pointer-events-auto flex flex-row items-center gap-3 md:flex-col md:items-start md:gap-4"
      aria-label="Cube stages"
    >
      {cubeProjects.map((project, index) => {
        const active = project.id === activeId
        return (
          <button
            key={project.id}
            type="button"
            onClick={() => onSelect(index)}
            aria-current={active ? 'step' : undefined}
            aria-label={`${project.index} ${project.shortName}`}
            data-cursor="hover"
            className={cn(
              'group flex items-center gap-2.5 text-left transition-opacity duration-300',
              active ? 'opacity-100' : 'opacity-45 hover:opacity-80',
            )}
          >
            <StageTick active={active} />
            <span
              className={cn(
                'font-mono text-[11px] tracking-[0.12em]',
                active ? 'text-museum-ink' : 'text-museum-muted',
              )}
            >
              {project.index}
            </span>
            <span
              className={cn(
                'hidden font-mono text-[11px] tracking-[0.08em] text-museum-brass md:inline',
                active ? 'opacity-100' : 'opacity-0 group-hover:opacity-70',
              )}
            >
              {project.shortName}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
