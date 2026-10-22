import { Suspense, useEffect, useLayoutEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import WetTrail from '../components/WetTrail'
import { useQuiet, useWords } from '../hooks'
import { paint } from '../paint/bus'
import Navigation from './Navigation'
import Footer from './Footer'
import Overture from './Overture'
import HomeFrame from './HomeFrame'

type Tone = 'night' | 'paper'
/** Pages under the shell may override the tone while they are mounted (null hands it back). */
export type ShellContext = { setTone: (tone: Tone | null) => void }

/** Pages set in the dark: the memory project and the film. */
const dark = (path: string) => path === '/alaya' || path === '/film' || path.startsWith('/film/')
/** The knife crosses and the paint parts (KNIFE_MS + OPEN_MS in paint/engine.ts). */
const PART_MS = 1600

/** This effect commits only when the route's Suspense content is actually ready. */
function PageReady({ path, report }: { path: string; report: (path: string) => void }) {
  useLayoutEffect(() => report(path), [path, report])
  return null
}

export default function Shell() {
  const { pathname } = useLocation(),
    quiet = useQuiet()
  const w = useWords()
  const [arrived, setArrived] = useState(pathname)
  const [override, setTone] = useState<Tone | null>(null)
  const tone = override ?? (dark(pathname) ? 'night' : 'paper')
  // Leaving home by any way at all keeps the painting up for one more moment,
  // over the page that has already arrived, and parts it.
  const [parting, setParting] = useState(false),
    [last, setLast] = useState(pathname)
  if (last !== pathname) {
    setLast(pathname)
    setParting(last === '/' && pathname !== '/' && !quiet)
  }
  const opening = parting && arrived === pathname
  useEffect(() => {
    if (pathname === '/') paint('home', { type: 'part', y: null })
    if (!opening) return
    paint('home', { type: 'part', y: innerHeight / 2 })
    const timer = setTimeout(() => setParting(false), PART_MS)
    return () => clearTimeout(timer)
  }, [opening, pathname])
  return (
    <div
      className="a-shell"
      data-tone={tone}
      data-page={pathname === '/' ? 'home' : pathname.startsWith('/film/') ? 'viewer' : undefined}
    >
      <Overture />
      {(pathname === '/' || parting) && <HomeFrame covering={parting} parting={opening} />}
      {parting && !opening && <p className="a-route-wait" role="status">{w('正在展开…', 'Unfolding…')}</p>}
      <WetTrail tone={tone} />
      <Navigation key={pathname} />
      {/* entered through the home painting: the page settles like fresh paint */}
      <main id="content" tabIndex={-1} data-arrival={opening ? 'parted' : undefined} aria-busy={parting && !opening}>
        <Suspense
          fallback={
            <div className="a-loading">
              <span>·</span> unfolding
            </div>
          }
        >
          <Outlet context={{ setTone } satisfies ShellContext} />
          <PageReady path={pathname} report={setArrived} />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
