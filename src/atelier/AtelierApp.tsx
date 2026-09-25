import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import {
  BrowserRouter,
  Link,
  NavLink,
  Outlet,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import { ArrowUp, ArrowUpRight, Check, Copy, Menu, X } from 'lucide-react'
import { LangProvider } from '@/context/LangProvider'
import { useLang } from '@/context/LangContext'
import ErrorBoundary from '@/components/ErrorBoundary'
import { useWords } from './hooks'
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
function Navigation() {
  const w = useWords(),
    { lang, setLang, t } = useLang(),
    [open, setOpen] = useState(false),
    button = useRef<HTMLButtonElement>(null),
    header = useRef<HTMLElement>(null)
  useEffect(() => {
    if (!open) return
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        button.current?.focus()
      }
    }
    const outside = (e: PointerEvent) => {
      if (e.target instanceof Node && !header.current?.contains(e.target))
        setOpen(false)
    }
    document.addEventListener('keydown', key)
    document.addEventListener('pointerdown', outside)
    return () => {
      document.removeEventListener('keydown', key)
      document.removeEventListener('pointerdown', outside)
    }
  }, [open])
  return (
    <header className="a-nav" data-open={open} ref={header}>
      <a
        className="a-skip"
        href="#content"
        onClick={(e) => {
          e.preventDefault()
          document.getElementById('content')?.focus()
          document.getElementById('content')?.scrollIntoView()
        }}
      >
        {w('跳到正文', 'Skip to content')}
      </a>
      <Link className="a-brand" to="/">
        tdwhere<span>.</span>
      </Link>
      <span className="a-nav-note">
        {w('阿黄 / 记忆、行动与表达', '阿黄 / memory, making & meaning')}
      </span>
      <button
        className="a-menu-trigger"
        ref={button}
        aria-expanded={open}
        aria-controls="atelier-navigation"
        aria-label={w(
          open ? '关闭导航' : '打开导航',
          open ? 'Close navigation' : 'Open navigation',
        )}
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
      <nav id="atelier-navigation" aria-label={w('主导航', 'Main navigation')}>
        {[
          ['/', w('画布', 'Canvas')],
          ['/alaya', 'Alaya'],
          ['/do-it', 'do-it'],
          ['/write-right', 'Write-Right'],
          ['/blog', w('手记', 'Notes')],
          ['/about', w('关于', 'About')],
        ].map(([to, label]) => (
          <NavLink
            end={to === '/'}
            key={to}
            to={to}
            onClick={() => setOpen(false)}
          >
            {label}
          </NavLink>
        ))}
        <a href={t.meta.githubUrl} target="_blank" rel="noreferrer">
          GitHub ↗
        </a>
        <div className="a-language" role="group" aria-label="Language / 语言">
          <button aria-pressed={lang === 'zh'} onClick={() => setLang('zh')}>
            中
          </button>
          <span>/</span>
          <button aria-pressed={lang === 'en'} onClick={() => setLang('en')}>
            EN
          </button>
        </div>
      </nav>
    </header>
  )
}
function Footer() {
  const w = useWords(),
    { t } = useLang(),
    [status, setStatus] = useState(''),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )
  async function copy() {
    try {
      await navigator.clipboard.writeText(t.meta.email)
      setStatus('copied')
    } catch {
      setStatus('error')
    }
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setStatus(''), 3000)
  }
  return (
    <footer className="a-footer">
      <div className="a-footer-top">
        <p>
          {w('问题会继续，', 'The questions continue.')}
          <br />
          <em>{w('我们也继续。', 'So do we.')}</em>
        </p>
        <div>
          <a href={`mailto:${t.meta.email}`}>
            {t.meta.email}
            <ArrowUpRight size={15} />
          </a>
          <button onClick={copy} aria-label={w('复制邮箱', 'Copy email')}>
            {status === 'copied' ? <Check size={15} /> : <Copy size={15} />}
          </button>
          <small aria-live="polite">
            {status === 'copied'
              ? w('已复制', 'Copied')
              : status === 'error'
                ? w('请使用邮箱链接。', 'Please use the email link.')
                : w(
                    '关于想法、项目，或者下一次对谈。',
                    'Ideas, projects, or the next conversation.',
                  )}
          </small>
        </div>
      </div>
      <div className="a-footer-signature" aria-hidden="true">
        tdwhere.
      </div>
      <div className="a-colophon">
        <span>© {new Date().getFullYear()} 阿黄 · tdwhere</span>
        <a href={t.meta.githubUrl} target="_blank" rel="noreferrer">
          GitHub / tdwhere123
        </a>
        <Link to="/playground">
          {w('还有一些未完成的尝试', 'Some unfinished experiments')} ↗
        </Link>
        <button
          aria-label={w('回到顶部', 'Back to top')}
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
                ? 'auto'
                : 'smooth',
            })
          }
        >
          <ArrowUp size={16} />
        </button>
      </div>
    </footer>
  )
}
function LocationEffects() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    window.history.scrollRestoration = 'manual'
    let timer: ReturnType<typeof setTimeout> | undefined
    let observer: MutationObserver | undefined
    if (hash) {
      const find = () => {
        const element = document.getElementById(
          decodeURIComponent(hash.slice(1)),
        )
        if (element) {
          element.scrollIntoView({ behavior: 'auto' })
          observer?.disconnect()
          return true
        }
        return false
      }
      if (!find()) {
        observer = new MutationObserver(find)
        observer.observe(document.body, { childList: true, subtree: true })
        timer = setTimeout(() => observer?.disconnect(), 4000)
      }
    } else window.scrollTo({ top: 0, behavior: 'auto' })
    if (!pathname.startsWith('/blog/'))
      document.title = `${({ '/': 'tdwhere', '/alaya': 'Alaya', '/do-it': 'do-it', '/write-right': 'Write-Right', '/about': 'About', '/blog': 'Field notes', '/playground': 'Elsewhere' } as Record<string, string>)[pathname] || '404'} · 阿黄`
    return () => {
      if (timer) clearTimeout(timer)
      observer?.disconnect()
    }
  }, [pathname, hash])
  return null
}
function Shell() {
  const { pathname } = useLocation()
  return (
    <div
      className="a-shell"
      data-tone={pathname === '/alaya' ? 'night' : 'paper'}
    >
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
