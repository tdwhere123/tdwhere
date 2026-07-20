import { forwardRef } from 'react'
import CubeFace from './CubeFace'
import { cubeProjects, type CubeStageId } from './cube-data'
import { cn } from '@/lib/utils'

type Props = {
  activeId: CubeStageId
  interactive: boolean
  hovered?: boolean
  /** When set, GSAP owns rotation — do not also set CSS transform from React. */
  gsapOwned?: boolean
  rotateX?: number
  rotateY?: number
}

const CORE_FACES = ['front', 'right', 'back', 'left', 'top', 'bottom'] as const

const ProjectCube = forwardRef<HTMLDivElement, Props>(function ProjectCube(
  { activeId, interactive, hovered, gsapOwned, rotateX = 0, rotateY = 0 },
  ref,
) {
  return (
    <div className="cube-scene">
      <div className="cube-scene__shadow" aria-hidden="true" />
      <div
        ref={ref}
        className={cn('project-cube', hovered && 'project-cube--hover')}
        style={
          gsapOwned
            ? undefined
            : { transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)` }
        }
      >
        {/* Opaque inner box — gives edge thickness when two faces meet */}
        <div className="project-cube__core" aria-hidden="true">
          {CORE_FACES.map((face) => (
            <span
              key={face}
              className={`project-cube__core-face project-cube__core-face--${face}`}
            />
          ))}
        </div>

        {cubeProjects.map((project) => (
          <CubeFace
            key={project.id}
            project={project}
            active={project.id === activeId}
            interactive={interactive && project.id === activeId}
          />
        ))}
      </div>
    </div>
  )
})

export default ProjectCube
