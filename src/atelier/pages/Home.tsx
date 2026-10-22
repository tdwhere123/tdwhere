import { useEffect, useState, type SyntheticEvent } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { useQuiet, useWords } from '../hooks'
import { centerOf, paint } from '../paint/bus'
import { caption, sessionClock, weatherNow } from '../weather'
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
 * weather in the corner is the island's, as it is now, and goes back to the
 * block of water to watch a while.
 */
export default function Home() {
  const quiet = useQuiet()
  const w = useWords(),
    { setTone } = useOutletContext<ShellContext>()
  useEffect(() => {
    setTone('night')
    return () => setTone(null)
  }, [setTone])
  const ripple = (e: SyntheticEvent<HTMLElement>) => {
    if (quiet) return
    const at = centerOf(e.currentTarget)
    if (at) paint('home', { type: 'pulse', ...at, radius: 0.06, amount: 0.4 })
  }
  const [weather, setWeather] = useState(() => weatherNow(sessionClock()))
  useEffect(() => {
    const timer = setInterval(() => setWeather(weatherNow(sessionClock())), 5000)
    return () => clearInterval(timer)
  }, [])
  const [zh, en] = caption(weather)
  return (
    <div className="a-home">
      <h1 className="a-signature">
        阿黄
        <span>tdwhere</span>
      </h1>
      <nav className="a-doors" aria-label={w('入口', 'Ways in')}>
        {doors.map((door, i) => (
          <Link key={door.to} to={door.to} onPointerEnter={(e) => { if (e.pointerType === 'mouse') ripple(e) }} onFocus={(e) => { if (e.currentTarget.matches(':focus-visible')) ripple(e) }} onPointerDown={(e) => { if (e.pointerType !== 'mouse') ripple(e) }}>
            <small>{String(i + 1).padStart(2, '0')}</small>
            <span>{w(door.zh, door.en)}</span>
          </Link>
        ))}
      </nav>
      <button type="button" className="a-weather" onClick={replayOverture} disabled={quiet}>
        {w(zh, en)}
        <small>{quiet ? w('已开启减少动态效果', 'Reduced motion is on') : w('去看一会儿', 'Watch a while')}</small>
      </button>
    </div>
  )
}
