/**
 * 房间主题 · Room themes.
 *
 * One museum, many rooms: every project page keeps the shared limestone /
 * brass gallery language, but each room carries its own accent and one quiet
 * atmospheric motif. The registry is the single place that maps a room to its
 * accent token — CSS (`[data-room]` selectors in index.css) and any future
 * component read from the same ids.
 */

export type RoomId = 'garden' | 'do-it' | 'alaya' | 'write-right' | 'sentinel'

export type RoomTheme = {
  /** CSS variable holding the accent, resolved in index.css. */
  accentVar: string
  /** One-line description of the room's motif (documentation only). */
  motif: string
}

export const ROOM_THEMES: Record<RoomId, RoomTheme> = {
  garden: {
    accentVar: 'var(--museum-brass)',
    motif: 'The shared gallery — limestone, brass, quiet grain.',
  },
  'do-it': {
    accentVar: 'var(--museum-brass)',
    motif: '黄铜闸门与秩序 — ordered brass hairlines at the margins.',
  },
  alaya: {
    accentVar: 'var(--moss)',
    motif: '苔藓与记忆光轨 — a moss glow and one slow light trail.',
  },
  'write-right': {
    accentVar: 'var(--tea-deep)',
    motif: '纸张与墨迹 — warm paper wash with an ink blot in the corner.',
  },
  sentinel: {
    accentVar: 'var(--dai)',
    motif: 'CRT 与档案 — the dark machine sits inside the lit gallery.',
  },
}
