export type CubeScreenRect = {
  /** Viewport fractions 0–1. */
  left: number
  right: number
  top: number
  bottom: number
  cx: number
  cy: number
  width: number
  height: number
}

export type CubeScreenAnchor = {
  /** Measured cube silhouette in the viewport (drives ink layout). */
  cube: CubeScreenRect
  /**
   * Convenience park point just outside the free side of `cube`
   * (normalized 0–1). Kept for caption / legacy callers.
   */
  x: number
  y: number
  preferRight: boolean
  /** Tip of the S-roll hint in screen space (normalized 0–1). */
  rollHintX: number
  rollHintY: number
  /** @deprecated kept for API compat */
  rollAngleDeg: number
}

export function emptyCubeAnchor(): CubeScreenAnchor {
  return {
    cube: {
      left: 0.39,
      right: 0.61,
      top: 0.3,
      bottom: 0.64,
      cx: 0.5,
      cy: 0.47,
      width: 0.22,
      height: 0.34,
    },
    x: 0.66,
    y: 0.52,
    preferRight: true,
    rollHintX: 0.5,
    rollHintY: 0.7,
    rollAngleDeg: 0,
  }
}
