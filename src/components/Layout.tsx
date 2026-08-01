import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import RoomAtmosphere from '@/components/RoomAtmosphere'
import type { RoomId } from '@/lib/rooms'
import { useLang } from '@/context/LangContext'
import { ZEN } from '@/lib/motion'


/**
 * Path → gallery room. Home keeps its own hall; about stays in the shared
 * gallery; the playground renders its own CRT room natively, so no layer
 * is needed there.
 */
function roomForPath(pathname: string): RoomId | null {
  if (pathname.startsWith('/do-it')) return 'do-it'
  if (pathname.startsWith('/alaya')) return 'alaya'
  if (pathname.startsWith('/write-right')) return 'write-right'
  return null
}

/**
 * Shared frame: fixed Navbar + routed content + Footer.
 * The navbar is `fixed top-0 z-50` (h-16), so the content slot owns the 64px
 * offset — pages start below the nav. Full-bleed heroes opt out inside the
 * page with `-mt-16`, never by removing this padding.
 *
 * Route changes play a short gallery curtain: the outgoing page dims, the
 * incoming one is revealed as a vertical wipe — one continuous museum, not a
 * stack of cards. Reduced-motion visitors get a plain cross-fade.
 */
export default function Layout() {
  const { lang } = useLang()
  const { pathname } = useLocation()
  const onHome = pathname === '/'
  const room = roomForPath(pathname)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (onHome) document.body.setAttribute('data-home-cube', '')
    else document.body.removeAttribute('data-home-cube')
    return () => document.body.removeAttribute('data-home-cube')
  }, [onHome])

  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper text-ink">
      {room && <RoomAtmosphere room={room} />}
      <Navbar />
      <main key={lang} className="animate-lang-fade relative z-[1] flex-1 pt-16">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pathname}
            initial={
              reduced ? { opacity: 0 } : { opacity: 0, clipPath: 'inset(0 0 100% 0)' }
            }
            animate={
              reduced ? { opacity: 1 } : { opacity: 1, clipPath: 'inset(0 0 0% 0)' }
            }
            exit={{ opacity: 0, transition: { duration: 0.18 } }}
            transition={
              reduced
                ? { duration: 0.2 }
                : { duration: 0.65, ease: ZEN, clipPath: { duration: 0.75, ease: ZEN } }
            }
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <div className="relative z-[1]">
        <Footer />
      </div>
    </div>
  )
}
