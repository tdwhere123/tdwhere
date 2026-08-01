import { Outlet, useLocation } from 'react-router-dom'
import { Suspense, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import RoomAtmosphere from '@/components/RoomAtmosphere'
import type { RoomId } from '@/lib/rooms'
import { useLang } from '@/context/LangContext'

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

function PageFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <span
        className="h-2 w-2 animate-pulse rounded-full bg-cobalt"
        aria-hidden="true"
      />
      <span className="sr-only">Loading…</span>
    </div>
  )
}

/**
 * Shared frame: fixed Navbar + routed content + Footer.
 * The navbar is `fixed top-0 z-50` (h-16), so the content slot owns the 64px
 * offset — pages start below the nav. Full-bleed heroes opt out inside the
 * page with `-mt-16`, never by removing this padding.
 *
 * invariant: never wrap <Outlet /> in an opacity→0 route curtain.
 * AnimatePresence + Outlet reuses the exiting wrapper with the *new* route
 * content, so the exit fade paints the incoming page to opacity 0 and the
 * enter pass never recovers — blank until hard refresh. Page heroes own
 * entrance motion; this shell stays paint-stable across SPA navigations.
 * Suspense sits inside the shell so Navbar/Footer survive lazy chunk loads.
 */
export default function Layout() {
  const { lang } = useLang()
  const { pathname } = useLocation()
  const onHome = pathname === '/'
  const room = roomForPath(pathname)

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
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <div className="relative z-[1]">
        <Footer />
      </div>
    </div>
  )
}
