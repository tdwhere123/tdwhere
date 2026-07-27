import { useCallback, useSyncExternalStore } from 'react'

const getServerSnapshot = () => false

export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (notify: () => void) => {
      if (typeof window === 'undefined') return () => undefined
      const mediaQuery = window.matchMedia(query)
      mediaQuery.addEventListener('change', notify)
      return () => mediaQuery.removeEventListener('change', notify)
    },
    [query],
  )

  const getSnapshot = useCallback(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
    [query],
  )

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
