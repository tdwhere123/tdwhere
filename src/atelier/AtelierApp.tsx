import { lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { LangProvider } from '@/context/LangProvider'
import ErrorBoundary from '@/components/ErrorBoundary'
import LocationEffects from './shell/LocationEffects'
import Shell from './shell/Shell'
import './atelier.css'
const Home = lazy(() => import('./pages/Home')),
  Projects = lazy(() => import('./pages/Projects')),
  Film = lazy(() => import('./pages/Film')),
  FilmViewer = lazy(() => import('./pages/FilmViewer')),
  Alaya = lazy(() => import('./pages/Alaya')),
  DoIt = lazy(() => import('./pages/DoIt')),
  About = lazy(() => import('./pages/About')),
  Blog = lazy(() => import('./pages/Blog')),
  Article = lazy(() => import('./pages/Article')),
  Playground = lazy(() => import('./pages/Playground')),
  Sentinel = lazy(() => import('./pages/Sentinel')),
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
              <Route path="projects" element={<Projects />} />
              <Route path="film" element={<Film />} />
              <Route path="film/:roll/:frame" element={<FilmViewer />} />
              <Route path="alaya" element={<Alaya />} />
              <Route path="do-it" element={<DoIt />} />
              <Route path="about" element={<About />} />
              <Route path="blog" element={<Blog />} />
              <Route path="blog/:slug" element={<Article />} />
              <Route path="sentinel" element={<Sentinel />} />
              <Route path="playground" element={<Playground />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </LangProvider>
  )
}
