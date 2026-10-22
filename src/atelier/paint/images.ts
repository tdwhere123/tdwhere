/** Decoded, authored painting assets shared by the still, WebGL and overture. */
export type PaintImage = HTMLCanvasElement | HTMLImageElement
const images = new Map<string, Promise<HTMLImageElement>>()

export function loadPainting(src: string) {
  let pending = images.get(src)
  if (!pending) {
    const image = new Image()
    image.src = src
    pending = image.decode().then(() => image, (error) => {
      images.delete(src)
      throw error
    })
    images.set(src, pending)
  }
  return pending
}
