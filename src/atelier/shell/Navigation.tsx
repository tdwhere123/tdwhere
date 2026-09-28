import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useLang } from '@/context/LangContext'
import { useWords } from '../hooks'
export default function Navigation() {
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
          ['/', w('首页', 'Home')],
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
