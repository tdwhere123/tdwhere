import type { MouseEvent, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { burnable, burnTo } from '../shell/burn'

/** A link to another note that burns the page on the way (shell/BurnLayer.tsx). */
export default function BurnLink({ to, className, children }: { to: string; className?: string; children: ReactNode }) {
  const turn = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || !burnable.value) return
    const x = e.clientX || e.currentTarget.getBoundingClientRect().left + 20,
      y = e.clientY || e.currentTarget.getBoundingClientRect().top + 10
    if (burnTo({ to, x, y })) e.preventDefault()
  }
  return (
    <Link to={to} className={className} onClick={turn}>
      {children}
    </Link>
  )
}
