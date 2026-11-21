import { useEffect, useRef, useState } from 'react'
import { Art } from '../components/Primitives'
import { HORIZON, heroFrame, homePainting } from '../grounds'
import { paint } from '../paint/bus'
import { paintingLight } from '../paint/light'
import { localHour } from '../daylight'

/**
 * The home painting: the sea at Zhujiajian, repainted. It lives in the shell, not the home page,
 * so that when a visitor leaves home it can stay over the page that has just arrived while the
 * tide runs up and takes the paint away. Its light is the visitor's own hour.
 */
export default function HomeFrame({ parting, covering, opening }: { parting: boolean; covering: boolean; opening: boolean }) {
  const frame = useRef<HTMLDivElement>(null)
  const [painting] = useState(homePainting)
  useEffect(() => {
    const tick = () => {
      if (document.hidden) return
      const value = paintingLight(localHour())
      paint('home', { type: 'light', value })
      // the still has no shader: only part of the dusk, as the live paint keeps its lights
      frame.current?.style.setProperty('--a-home-exposure', String(0.45 + value.exposure * 0.55))
    }
    tick()
    const timer = setInterval(tick, 30_000)
    document.addEventListener('visibilitychange', tick)
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', tick) }
  }, [])
  return (
    <div
      ref={frame}
      className="a-frame"
      data-covering={covering ? '' : undefined}
      data-parting={parting ? '' : undefined}
      data-opening={opening ? '' : undefined}
      aria-hidden="true"
    >
      <Art frame={heroFrame} prepared={painting.src} relief={painting.relief} flow={HORIZON} eager channel="home" className="a-frame-art" />
      <div className="a-frame-veil" />
    </div>
  )
}
