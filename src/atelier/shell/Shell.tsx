import { Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import WetTrail from '../components/WetTrail'
import Navigation from './Navigation'
import Footer from './Footer'
export default function Shell() {
  const { pathname } = useLocation()
  const tone = pathname === '/alaya' ? 'night' : 'paper'
  return (
    <div className="a-shell" data-tone={tone}>
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
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
