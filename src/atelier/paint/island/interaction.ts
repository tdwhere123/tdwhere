export function pickBird(birds: readonly { x: number; y: number; visible: boolean }[], x: number, y: number) {
  let picked = -1, distance = 22
  birds.forEach((bird, i) => {
    const d = Math.hypot(bird.x - x, bird.y - y)
    if (bird.visible && d <= distance) { picked = i; distance = d }
  })
  return picked
}

export class PondGesture {
  dragged = false
  readonly id: number
  readonly x: number
  readonly y: number
  constructor(id: number, x: number, y: number) { this.id = id; this.x = x; this.y = y }
  move(id: number, x: number, y: number) {
    if (id === this.id && Math.hypot(x - this.x, y - this.y) > 8) this.dragged = true
  }
  finish(id: number) { return id === this.id && !this.dragged }
}
