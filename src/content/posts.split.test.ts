import fs from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('posts / postBodies split', () => {
  it('the post list module carries no bodies', async () => {
    const m = await import('./posts')
    expect(Object.keys(m).sort()).toEqual(['getPost', 'posts'])
  })

  it('every listed post has its body', async () => {
    const { posts } = await import('./posts')
    const { getPostBody } = await import('./postBodies')
    for (const post of posts) {
      const file = new URL(`./posts/${post.slug}.md`, import.meta.url)
      expect(getPostBody(post.slug), post.slug).toBe(fs.readFileSync(file, 'utf8'))
    }
  })
})
