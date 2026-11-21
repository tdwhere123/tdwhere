import { useSyncExternalStore } from 'react'

/**
 * The opening plays once a session, on a first visit that lands on the home page:
 * the painting is laid on the paper while the rest of the site loads behind it.
 */
const SEEN = 'tdwhere:opened'
let done = true
let decided = false
const listeners = new Set<() => void>()

function seen() {
  try {
    return sessionStorage.getItem(SEEN) === '1'
  } catch {
    return false
  }
}

/** Decided once, at the first render of the shell. */
export function decideOpening(path: string, quiet: boolean) {
  if (decided) return !done
  decided = true
  done = !(path === '/' && !quiet && !seen())
  return !done
}

export function finishOpening() {
  if (done) return
  done = true
  try {
    sessionStorage.setItem(SEEN, '1')
  } catch {
    /* the next visit opens again */
  }
  listeners.forEach((fn) => fn())
}

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** True once the opening has finished, or when there was none. */
export function useOpened() {
  return useSyncExternalStore(subscribe, () => done, () => true)
}
