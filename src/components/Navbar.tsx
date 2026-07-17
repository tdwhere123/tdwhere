import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Github, Menu, X } from 'lucide-react'
import { useLang } from '@/context/LangContext'
import LangToggle from '@/components/LangToggle'
import SealMark from '@/components/SealMark'
import { getLenis } from '@/lib/smooth-scroll'
import { cn } from '@/lib/utils'

const ZEN = [0.22, 1, 0.36, 1] as [number, number, number, number]

export default function Navbar() {
  const { t } = useLang()
  const { pathname } = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const onHome = pathname === '/'

  const links = [
    { to: '/', label: t.nav.projects, end: true },
    { to: '/about', label: t.nav.about, end: false },
  ]

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const lenis = getLenis()
    if (open) {
      document.body.style.overflow = 'hidden'
      lenis?.stop()
    } else {
      document.body.style.overflow = ''
      lenis?.start()
    }
    return () => {
      document.body.style.overflow = ''
      lenis?.start()
    }
  }, [open])

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-all duration-300 ease-zen',
          scrolled ? 'h-14 border-b border-hairline' : 'h-16 border-b border-transparent',
        )}
        style={{
          background: scrolled
            ? 'color-mix(in srgb, var(--museum-bg) 88%, transparent)'
            : onHome
              ? 'transparent'
              : 'color-mix(in srgb, var(--museum-bg) 72%, transparent)',
          backdropFilter: scrolled ? 'blur(16px)' : onHome ? 'none' : 'blur(10px)',
          WebkitBackdropFilter: scrolled ? 'blur(16px)' : onHome ? 'none' : 'blur(10px)',
        }}
      >
        <div className="mx-auto flex h-full max-w-shell items-center justify-between px-5 md:px-10">
          <Link to="/" className="flex items-center gap-2.5" aria-label="阿黄 tdwhere — home">
            <SealMark size={28} className="shrink-0" />
            <span className="font-serif text-lg font-semibold leading-none text-ink">阿黄</span>
            <span className="mt-0.5 font-mono text-xs leading-none text-faint">tdwhere</span>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  cn(
                    'group relative font-mono text-xs uppercase tracking-[0.14em] transition-colors duration-300',
                    isActive ? 'text-ink' : 'text-ink-3 hover:text-ink',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {l.label}
                    <span
                      aria-hidden="true"
                      className={cn(
                        'absolute -bottom-1.5 left-0 h-px bg-museum-brass transition-all duration-300 ease-zen',
                        isActive ? 'w-full' : 'w-0 group-hover:w-full',
                      )}
                    />
                  </>
                )}
              </NavLink>
            ))}
            <a
              href={t.meta.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="group relative font-mono text-xs uppercase tracking-[0.14em] text-ink-3 transition-colors duration-300 hover:text-ink"
            >
              {t.nav.github}
              <span
                aria-hidden="true"
                className="absolute -bottom-1.5 left-0 h-px w-0 bg-museum-brass transition-all duration-300 ease-zen group-hover:w-full"
              />
            </a>
            <LangToggle />
          </nav>

          <button
            type="button"
            className="grid h-10 w-10 place-items-center text-ink lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            key="drawer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            transition={{ duration: 0.3, ease: ZEN }}
            className="fixed inset-0 z-40 flex flex-col bg-museum-bg lg:hidden"
          >
            <nav
              className="flex flex-1 flex-col justify-center gap-2 px-8 pt-16"
              aria-label="Mobile"
            >
              {[...links, { to: t.meta.githubUrl, label: t.nav.github, end: false, external: true }].map(
                (l, i) => (
                  <motion.div
                    key={l.to}
                    initial={{ y: 28, opacity: 0, filter: 'blur(6px)' }}
                    animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                    transition={{ duration: 0.7, ease: ZEN, delay: 0.06 + i * 0.07 }}
                  >
                    {'external' in l && l.external ? (
                      <a
                        href={l.to}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => setOpen(false)}
                        className="flex items-baseline gap-4 border-b border-hairline py-4 font-serif text-4xl font-semibold text-ink-3"
                      >
                        <span className="font-mono text-xs text-faint">0{i + 1}</span>
                        {l.label}
                      </a>
                    ) : (
                      <NavLink
                        to={l.to}
                        end={'end' in l ? l.end : false}
                        onClick={() => setOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            'flex items-baseline gap-4 border-b border-hairline py-4 font-serif text-4xl font-semibold',
                            isActive ? 'text-ink' : 'text-ink-3',
                          )
                        }
                      >
                        <span className="font-mono text-xs text-faint">0{i + 1}</span>
                        {l.label}
                      </NavLink>
                    )}
                  </motion.div>
                ),
              )}
            </nav>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.4 }}
              className="flex items-center justify-between px-8 pb-10"
            >
              <LangToggle />
              <a
                href={t.meta.githubUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub — tdwhere123"
                className="text-ink-3 transition-colors duration-300 hover:text-seal"
              >
                <Github className="h-5 w-5" />
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
