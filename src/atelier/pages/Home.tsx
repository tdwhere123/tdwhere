import { useEffect, type PointerEvent } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { useWords } from '../hooks'
import { centerOf, paint } from '../paint/bus'
import { caption, weatherAt } from '../weather'
import { replayOverture } from '../shell/overtureCue'
import type { ShellContext } from '../shell/Shell'

const doors = [
  { to: '/projects', zh: '项目', en: 'Projects' },
  { to: '/film', zh: '胶片', en: 'Film' },
  { to: '/blog', zh: '手记', en: 'Notes' },
  { to: '/about', zh: '关于', en: 'About' },
]

/**
 * A name and four ways in, over the home painting (shell/HomeFrame.tsx).
 * Leaving parts the painting with a palette knife; the shell does that. The
 * weather in the corner goes back to the block of water, to watch a while.
 */
export default function Home() {
  const w = useWords(),
    { setTone } = useOutletContext<ShellContext>()
  useEffect(() => {
    setTone('night')
    return () => setTone(null)
  }, [setTone])
  const ripple = (e: PointerEvent<HTMLElement>) => {
    const at = centerOf(e.currentTarget)
    if (at) paint('home', { type: 'pulse', ...at, radius: 0.06, amount: 0.4 })
  }
  const [zh, en] = caption(weatherAt(new Date()))
  return (
    <div className="a-home">
      <h1 className="a-signature">
        阿黄
        <span>tdwhere</span>
      </h1>
      <nav className="a-doors" aria-label={w('入口', 'Ways in')}>
        {doors.map((door, i) => (
          <Link key={door.to} to={door.to} onPointerEnter={ripple}>
            <small>{String(i + 1).padStart(2, '0')}</small>
            <span>{w(door.zh, door.en)}</span>
          </Link>
        ))}
      </nav>
      <button type="button" className="a-weather" onClick={replayOverture}>
        {w(zh, en)}
        <small>{w('去看一会儿', 'Watch a while')}</small>
      </button>
    </div>
  )
}
