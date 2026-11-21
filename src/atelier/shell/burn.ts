/** Asks the shell to burn the page away and show `to` under the ash (shell/BurnLayer.tsx). */
export type Burn = { to: string; x: number; y: number }

const listeners = new Set<(burn: Burn) => void>()

export function onBurn(listener: (burn: Burn) => void) {
  listeners.add(listener)
  return () => void listeners.delete(listener)
}

/** False when nothing is listening (no layer, or no WebGL): the caller navigates as usual. */
export function burnTo(burn: Burn) {
  if (!listeners.size) return false
  listeners.forEach((fn) => fn(burn))
  return true
}

/** Set by the layer once it knows it can draw fire. */
export const burnable = { value: false }
