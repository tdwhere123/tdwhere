import { Link } from 'react-router-dom'
import { CUBE_SHELL, type CubeProject } from './cube-data'
import { cn } from '@/lib/utils'

type Props = {
  project: CubeProject
  active: boolean
  interactive: boolean
}

export default function CubeFace({ project, active, interactive }: Props) {
  const faceClass = `cube-face cube-face--${project.face}`
  const content = (
    <>
      <div className="cube-face__content">
        <img
          src={project.image}
          alt={project.alt}
          loading={project.id === 'home' || project.id === 'alaya' ? 'eager' : 'lazy'}
          decoding="async"
        />
      </div>
      <div className="cube-face__inner-shadow" aria-hidden="true" />
      <img
        className="cube-face__shell"
        src={CUBE_SHELL}
        alt=""
        aria-hidden="true"
        draggable={false}
      />
      <div className="cube-face__glass" aria-hidden="true" />
      <div className="cube-face__effects" data-face-effects={project.id} />
    </>
  )

  if (interactive && project.route) {
    return (
      <Link
        to={project.route}
        className={cn(faceClass, active && 'cube-face--active')}
        data-cursor="hover"
        aria-label={`${project.title} — open`}
      >
        {content}
      </Link>
    )
  }

  if (interactive && project.github && !project.route) {
    return (
      <a
        href={project.github}
        target="_blank"
        rel="noreferrer"
        className={cn(faceClass, active && 'cube-face--active')}
        data-cursor="hover"
        aria-label={`${project.title} — GitHub`}
      >
        {content}
      </a>
    )
  }

  return (
    <div className={cn(faceClass, active && 'cube-face--active')} aria-hidden={!active}>
      {content}
    </div>
  )
}
