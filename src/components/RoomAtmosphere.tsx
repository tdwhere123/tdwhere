import type { CSSProperties } from 'react'
import { ROOM_THEMES, type RoomId } from '@/lib/rooms'

/**
 * 房间氛围层 · Room atmosphere.
 *
 * Decorative background layer for project pages: a per-room accent wash plus
 * one quiet motif (ordered brass hairlines for do-it, a drifting memory
 * trail for Alaya, an ink blot for Write-Right). The accent comes from the
 * ROOM_THEMES registry via `--room-accent`; all visuals live in index.css so
 * the layer itself carries no behavior. aria-hidden, pointer-events none.
 * Drift animations are disabled under prefers-reduced-motion.
 */
export default function RoomAtmosphere({ room }: { room: RoomId }) {
  return (
    <div
      aria-hidden="true"
      className="room-atmosphere"
      data-room={room}
      style={{ '--room-accent': ROOM_THEMES[room].accentVar } as CSSProperties}
    />
  )
}
