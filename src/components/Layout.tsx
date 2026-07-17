import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { useLang } from '@/context/LangContext'

/**
 * Shared frame: fixed Navbar + routed content + Footer.
 * The navbar is `fixed top-0 z-50` (h-16), so the content slot owns the 64px
 * offset — pages start below the nav. Full-bleed heroes opt out inside the
 * page with `-mt-16`, never by removing this padding.
 */
export default function Layout() {
  const { lang } = useLang()
  const { pathname } = useLocation()
  const onHome = pathname === '/'

  useEffect(() => {
    if (onHome) document.body.setAttribute('data-home-cube', '')
    else document.body.removeAttribute('data-home-cube')
    return () => document.body.removeAttribute('data-home-cube')
  }, [onHome])

  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper text-ink">
      <Navbar />
      <main key={lang} className="animate-lang-fade flex-1 pt-16">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
