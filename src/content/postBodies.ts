/**
 * 文章正文 · Post bodies, loaded via Vite ?raw glob.
 * Only the article page imports this, so the /blog list does not ship the bodies.
 */
const bodies = import.meta.glob('./posts/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

export function getPostBody(slug: string): string | undefined {
  return bodies[`./posts/${slug}.md`]
}
