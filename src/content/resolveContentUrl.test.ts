import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { getPostBody, posts } from './posts'
import { resolveContentUrl } from './resolveContentUrl'

describe('resolveContentUrl', () => {
  it('roots essay images at the site base instead of the article route', () => {
    expect(resolveContentUrl('posts/learn-ai-by-building/img-1.jpg', '/')).toBe(
      '/posts/learn-ai-by-building/img-1.jpg',
    )
    expect(resolveContentUrl('/posts/learn-ai-by-building/img-1.jpg', '/tdwhere/')).toBe(
      '/tdwhere/posts/learn-ai-by-building/img-1.jpg',
    )
    expect(resolveContentUrl('https://linux.do/img.png', '/')).toBe(
      'https://linux.do/img.png',
    )
  })

  it('points every image in the essays at a file in public/', () => {
    const found: string[] = []
    for (const post of posts) {
      const body = getPostBody(post.slug) ?? ''
      for (const match of body.matchAll(/!\[[^\]]*\]\(([^)\s]+)\)/g)) {
        const resolved = resolveContentUrl(match[1], '/')
        expect(resolved.startsWith('/posts/')).toBe(true)
        const file = path.join(process.cwd(), 'public', decodeURIComponent(resolved.slice(1)))
        expect(fs.existsSync(file), file).toBe(true)
        found.push(resolved)
      }
    }
    expect(found.length).toBeGreaterThan(0)
  })
})
