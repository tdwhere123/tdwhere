import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { LangProvider } from '@/context/LangContext'
import Layout from '@/components/Layout'
import Cursor from '@/components/Cursor'
import Home from '@/pages/Home'
import { initSmoothScroll, scrollToTop } from '@/lib/smooth-scroll'

const DoIt = lazy(() => import('@/pages/DoIt'))
const Alaya = lazy(() => import('@/pages/Alaya'))
const WriteRight = lazy(() => import('@/pages/WriteRight'))
const Playground = lazy(() => import('@/pages/Playground'))
const About = lazy(() => import('@/pages/About'))

function PageFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <span className="h-2 w-2 animate-pulse rounded-full bg-tea" aria-hidden="true" />
      <span className="sr-only">Loading…</span>
    </div>
  )
}

function ScrollManager() {
  const { pathname } = useLocation()
  useEffect(() => {
    scrollToTop(true)
    // let the new page paint before ScrollTrigger re-measures
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 60)
    return () => window.clearTimeout(id)
  }, [pathname])
  return null
}

export default function App() {
  useEffect(() => initSmoothScroll(), [])

  return (
    <LangProvider>
      <BrowserRouter>
        <ScrollManager />
        <Cursor />
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="do-it" element={<DoIt />} />
              <Route path="alaya" element={<Alaya />} />
              <Route path="write-right" element={<WriteRight />} />
              <Route path="playground" element={<Playground />} />
              <Route path="about" element={<About />} />
              <Route path="*" element={<Home />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </LangProvider>
  )
}
