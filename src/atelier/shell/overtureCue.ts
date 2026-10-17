const CUE = 'tdwhere:overture-again'

/** Brings the overture back over the home page, to watch the weather a while. */
export const replayOverture = () => dispatchEvent(new Event(CUE))

export function onReplay(listener: () => void) {
  addEventListener(CUE, listener)
  return () => removeEventListener(CUE, listener)
}
