import { useEffect, useRef, useState } from 'react'
import { Art } from '../components/Primitives'
import { heroFrame, homePainting } from '../grounds'
import { paint } from '../paint/bus'
import { paintingLight } from '../paint/light'
import { islandSky } from '../paint/island/state'
import { sessionClock } from '../weather'

/**
 * The home painting. It lives in the shell, not the home page, so that when a
 * visitor leaves home it can stay over the page that has just arrived and be
 * parted by the palette knife to show it.
 */
export default function HomeFrame({ parting, covering }: { parting: boolean; covering: boolean }) {
  const frame = useRef<HTMLDivElement>(null)
  const [painting] = useState(homePainting)
  useEffect(() => {
    const clock = sessionClock()
    const tick = () => {
      if (document.hidden) return
      const value = paintingLight(islandSky(clock, Date.now()))
      paint('home', { type: 'light', value })
      // the still has no shader: only part of the dusk, as the live paint keeps its lights
      frame.current?.style.setProperty('--a-home-exposure', String(0.45 + value.exposure * 0.55))
    }
    tick()
    const timer = setInterval(tick, 1000)
    document.addEventListener('visibilitychange', tick)
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', tick) }
  }, [])
  return (
    <div ref={frame} className="a-frame" data-covering={covering ? '' : undefined} data-parting={parting ? '' : undefined} aria-hidden="true">
      <Art frame={heroFrame} prepared={painting.src} relief={painting.relief} eager channel="home" className="a-frame-art" />
      <div className="a-frame-haze" />
      <div className="a-frame-veil" />
    </div>
  )
}
