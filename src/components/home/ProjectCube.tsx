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

const ProjectCube = forwardRef<HTMLDivElement, Props>(function ProjectCube(
  { activeId, interactive, hovered, gsapOwned, rotateX = 0, rotateY = 0 },
  ref,
) {
  return (
    <div className="cube-scene">
      <div
        ref={ref}
        className={cn('project-cube', hovered && 'project-cube--hover')}
        style={
          gsapOwned
            ? undefined
            : { transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)` }
        }
      >
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
