import { Link } from 'react-router-dom'
import { useLang } from '@/context/LangContext'

export default function NotFound() {
  const { lang } = useLang()
  const title = lang === 'zh' ? '页不存在' : 'Page not found'
  const body =
    lang === 'zh'
      ? '这条走廊没有展品。回院子看看别的。'
      : 'Nothing hangs in this corridor. Head back to the garden.'
  const home = lang === 'zh' ? '回首页' : 'Back home'

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-24 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-museum-muted">404</p>
      <h1 className="mt-4 font-display text-h2 font-semibold text-museum-ink">{title}</h1>
      <p className="mt-4 max-w-md text-[15px] leading-relaxed text-museum-muted">{body}</p>
      <Link
        to="/"
        className="mt-10 font-mono text-sm text-museum-muted transition-colors hover:text-cobalt"
      >
        ← {home}
      </Link>
    </div>
  )
}
