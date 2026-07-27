import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { content } from '@/content'
import { LangContext } from '@/context/LangContext'
import type { Lang, LangContextValue } from '@/context/LangContext'

const STORAGE_KEY = 'tdwhere-lang'

function readInitialLang(): Lang {
  if (typeof window === 'undefined') return 'zh'
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved === 'zh' || saved === 'en') return saved
  } catch {
    /* storage unavailable — fall through to default */
  }
  return 'zh'
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readInitialLang)

  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh' : 'en'
    try {
      window.localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      /* ignore */
    }
  }, [lang])

  const setLang = useCallback((next: Lang) => setLangState(next), [])
  const toggle = useCallback(() => setLangState((l) => (l === 'zh' ? 'en' : 'zh')), [])

  const value = useMemo<LangContextValue>(
    () => ({ lang, t: content[lang], setLang, toggle }),
    [lang, setLang, toggle],
  )

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}
