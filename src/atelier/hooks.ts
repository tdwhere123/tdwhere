import { useEffect, useState, useSyncExternalStore } from 'react'
import { useLang } from '@/context/LangContext'
export const useWords = () => {
  const { lang } = useLang()
  return (zh: string, en: string) => (lang === 'zh' ? zh : en)
}
const reducedQuery = '(prefers-reduced-motion: reduce)'
function subscribeMotion(fn: () => void) {
  const m = matchMedia(reducedQuery)
  m.addEventListener('change', fn)
  return () => m.removeEventListener('change', fn)
}
export function useQuiet() {
  return useSyncExternalStore(
    subscribeMotion,
    () => matchMedia(reducedQuery).matches,
    () => true,
  )
}
const narrowQuery = '(max-width: 850px)'
function subscribeNarrow(fn: () => void) {
  const m = matchMedia(narrowQuery)
  m.addEventListener('change', fn)
  return () => m.removeEventListener('change', fn)
}
export function useNarrow() {
  return useSyncExternalStore(
    subscribeNarrow,
    () => matchMedia(narrowQuery).matches,
    () => false,
  )
}
function subscribeVisibility(fn: () => void) {
  document.addEventListener('visibilitychange', fn)
  return () => document.removeEventListener('visibilitychange', fn)
}
export function useVisibleTab() {
  return useSyncExternalStore(
    subscribeVisibility,
    () => !document.hidden,
    () => true,
  )
}
export function useSequence(count: number) {
  const [step, setStep] = useState(0),
    [playing, setPlaying] = useState(false)
  const quiet = useQuiet(),
    visible = useVisibleTab()
  useEffect(() => {
    if (!playing || quiet || !visible) return
    const timer = window.setTimeout(() => {
      if (step >= count - 1) setPlaying(false)
      else setStep((value) => value + 1)
    }, 1250)
    return () => window.clearTimeout(timer)
  }, [count, playing, quiet, step, visible])
  return {
    step,
    playing,
    setStep,
    pause: () => setPlaying(false),
    play: () => {
      if (quiet) {
        setStep(count - 1)
        setPlaying(false)
      } else {
        if (step === count - 1) setStep(0)
        setPlaying((value) => !value)
      }
    },
    reset: () => {
      setPlaying(false)
      setStep(0)
    },
  }
}
