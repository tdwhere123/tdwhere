import { lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { LangProvider } from '@/context/LangProvider'
import ErrorBoundary from '@/components/ErrorBoundary'
import LocationEffects from './shell/LocationEffects'
import Shell from './shell/Shell'
import './atelier.css'
const Home = lazy(() => import('./pages/Home')),
  Alaya = lazy(() => import('./pages/Alaya')),
  DoIt = lazy(() => import('./pages/DoIt')),
  WriteRight = lazy(() => import('./pages/WriteRight')),
  About = lazy(() => import('./pages/About')),
  Blog = lazy(() => import('./pages/Blog')),
  Article = lazy(() => import('./pages/Article')),
  Playground = lazy(() => import('./pages/Playground')),
  NotFound = lazy(() => import('./pages/NotFound'))
export default function AtelierApp() {
  return (
    <LangProvider>
      <BrowserRouter
        basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}
      >
        <LocationEffects />
        <ErrorBoundary>
          <Routes>
            <Route element={<Shell />}>
              <Route index element={<Home />} />
              <Route path="alaya" element={<Alaya />} />
              <Route path="do-it" element={<DoIt />} />
              <Route path="write-right" element={<WriteRight />} />
              <Route path="about" element={<About />} />
              <Route path="blog" element={<Blog />} />
              <Route path="blog/:slug" element={<Article />} />
              <Route path="playground" element={<Playground />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </LangProvider>
  )
}
