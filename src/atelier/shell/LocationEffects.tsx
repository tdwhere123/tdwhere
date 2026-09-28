import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
export default function LocationEffects() {
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
