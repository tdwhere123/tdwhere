import { Suspense, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import WetTrail from '../components/WetTrail'
import Navigation from './Navigation'
import Footer from './Footer'
import Overture from './Overture'

type Tone = 'night' | 'paper'
/** Pages under the shell may override the tone while they are mounted (null hands it back). */
export type ShellContext = { setTone: (tone: Tone | null) => void }

export default function Shell() {
  const { pathname } = useLocation()
  const [override, setTone] = useState<Tone | null>(null)
  const tone = override ?? (pathname === '/alaya' ? 'night' : 'paper')
  return (
    <div
      className="a-shell"
      data-tone={tone}
      data-page={pathname === '/' ? 'home' : undefined}
    >
      <Overture />
      <WetTrail tone={tone} />
      <Navigation key={pathname} />
      <main id="content" tabIndex={-1}>
        <Suspense
          fallback={
            <div className="a-loading">
              <span>·</span> unfolding
            </div>
          }
        >
          <Outlet context={{ setTone } satisfies ShellContext} />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
