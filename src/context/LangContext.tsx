import { createContext, useContext } from 'react'
import type { Content } from '@/content'

export type Lang = 'zh' | 'en'

export type LangContextValue = {
  lang: Lang
  t: Content
  setLang: (lang: Lang) => void
  toggle: () => void
}

export const LangContext = createContext<LangContextValue | null>(null)

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used inside <LangProvider>')
  return ctx
}
