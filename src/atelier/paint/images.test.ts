import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadPainting } from './images'

afterEach(() => vi.unstubAllGlobals())

describe('prepared painting decode', () => {
  it('shares one decoded source between an overlay and a late painting', async () => {
    const decode = vi.fn().mockResolvedValue(undefined)
    const images: unknown[] = []
    vi.stubGlobal('Image', class {
      src = ''
      decode = decode
      constructor() { images.push(this) }
    })
    const overlay = loadPainting('/shared-paint.webp')
    const home = loadPainting('/shared-paint.webp')
    expect(home).toBe(overlay)
    expect(await home).toBe(images[0])
    expect(decode).toHaveBeenCalledOnce()
  })
  it('does not retain a failed decode when an image becomes available again', async () => {
    const decode = vi.fn().mockRejectedValueOnce(new Error('missing')).mockResolvedValue(undefined)
    vi.stubGlobal('Image', class { src = ''; decode = decode })
    await expect(loadPainting('/retry-paint.webp')).rejects.toThrow('missing')
    await expect(loadPainting('/retry-paint.webp')).resolves.toHaveProperty('src', '/retry-paint.webp')
    expect(decode).toHaveBeenCalledTimes(2)
  })
})
