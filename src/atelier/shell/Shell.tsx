import { Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import WetTrail from '../components/WetTrail'
import { useQuiet, useWords } from '../hooks'
import { paint } from '../paint/bus'
import { TIDE_MS } from '../paint/presets'
import { enter, startSmoothScroll } from '../motion'
import Navigation from './Navigation'
import Footer from './Footer'
import HomeFrame from './HomeFrame'
import Opening from './Opening'
import BurnLayer from './BurnLayer'
import { decideOpening, useOpened } from './opening'

type Tone = 'night' | 'paper'
/** Pages under the shell may override the tone while they are mounted (null hands it back). */
export type ShellContext = { setTone: (tone: Tone | null) => void }

/** Pages set in the dark: the memory project, the film, and the notes, where the paper burns. */
const dark = (path: string) =>
  path === '/alaya' || path === '/film' || path.startsWith('/film/') || path === '/blog' || path.startsWith('/blog/')
/** The tide runs up the painting (TIDE_MS in paint/presets.ts), then the page is left to itself. */
const PART_MS = TIDE_MS + 120

/** This effect commits only when the route's Suspense content is actually ready. */
function PageReady({ path, report }: { path: string; report: (path: string) => void }) {
  useLayoutEffect(() => report(path), [path, report])
  return null
}

function pageOf(pathname: string) {
  if (pathname === '/') return 'home'
  if (pathname.startsWith('/film/')) return 'viewer'
  if (pathname === '/blog' || pathname.startsWith('/blog/')) return 'notes'
  return undefined
}

export default function Shell() {
  const { pathname } = useLocation(),
    quiet = useQuiet()
  const w = useWords()
  const [opening] = useState(() => decideOpening(pathname, quiet))
  const opened = useOpened()
  // null until the first page's lazy content has actually arrived
  const [arrived, setArrived] = useState<string | null>(null)
  const [override, setTone] = useState<Tone | null>(null)
  const tone = override ?? (dark(pathname) ? 'night' : 'paper')
  const main = useRef<HTMLElement>(null)
  useEffect(() => startSmoothScroll(), [])
  // Leaving home by any way at all keeps the painting up for one more moment,
  // over the page that has already arrived, and the tide takes it away.
  const [parting, setParting] = useState(false),
    [last, setLast] = useState(pathname)
  if (last !== pathname) {
    setLast(pathname)
    setParting(last === '/' && pathname !== '/' && !quiet)
  }
  const tiding = parting && arrived === pathname
  useEffect(() => {
    if (pathname === '/') paint('home', { type: 'part', y: null })
    if (!tiding) return
    paint('home', { type: 'part', y: innerHeight / 2 })
    const timer = setTimeout(() => setParting(false), PART_MS)
    return () => clearTimeout(timer)
  }, [tiding, pathname])
  // the page's headings come up out of their slots once it has arrived (home waits for the opening)
  useEffect(() => {
    if (arrived !== pathname || !main.current || (pathname === '/' && !opened)) return
    return enter(main.current)
  }, [arrived, pathname, opened])
  return (
    <div className="a-shell" data-tone={tone} data-page={pageOf(pathname)} data-opened={opened ? '' : undefined}>
      {(pathname === '/' || parting) && <HomeFrame covering={parting} parting={tiding} opening={!opened} />}
      {opening && !opened && <Opening />}
      {parting && !tiding && <p className="a-route-wait" role="status">{w('正在打开…', 'Opening…')}</p>}
      <WetTrail tone={tone} />
      <BurnLayer />
      <Navigation key={pathname} />
      <main
        id="content"
        ref={main}
        tabIndex={-1}
        data-arrival={tiding ? 'tide' : undefined}
        aria-busy={parting && !tiding}
      >
        <Suspense fallback={<div className="a-loading" role="status">{w('加载中', 'Loading')}</div>}>
          <Outlet context={{ setTone } satisfies ShellContext} />
          <PageReady path={pathname} report={setArrived} />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
