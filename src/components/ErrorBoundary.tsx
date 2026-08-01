import { Component, type ErrorInfo, type ReactNode } from 'react'
import { useLang } from '@/context/LangContext'

type Props = { children: ReactNode }
type State = { hasError: boolean }

/* Class boundaries are incompatible with react-refresh's function-only heuristic. */
/* eslint-disable react-refresh/only-export-components -- ErrorBoundary class + hook fallback */

function ErrorFallback() {
  const { lang } = useLang()
  const title =
    lang === 'zh' ? '展厅出了点问题' : 'Something went wrong in the gallery'
  const body =
    lang === 'zh'
      ? '这一页暂时打不开。刷新试试，或稍后再来。'
      : 'This page could not be shown. Try reloading, or come back later.'
  const reload = lang === 'zh' ? '刷新页面' : 'Reload'

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-24 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-museum-muted">
        {lang === 'zh' ? '故障' : 'Error'}
      </p>
      <h1 className="mt-4 font-display text-h2 font-semibold text-museum-ink">{title}</h1>
      <p className="mt-4 max-w-md text-[15px] leading-relaxed text-museum-muted">{body}</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-10 rounded-none border border-ink/25 px-7 py-3.5 font-mono text-sm text-museum-ink transition-colors duration-300 hover:border-cobalt hover:text-cobalt"
      >
        {reload}
      </button>
    </div>
  )
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />
    }
    return this.props.children
  }
}

