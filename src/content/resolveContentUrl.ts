import { defaultUrlTransform } from 'react-markdown'

/**
 * Essay markdown stores images as `posts/<slug>/img-n.jpg` (files in `public/`).
 * On `/blog/:slug` a relative URL would resolve under `/blog/`, so root it at the Vite base.
 * Absolute http(s) links and hashes pass through. Unsafe protocols are already stripped.
 */
export function resolveContentUrl(
  url: string,
  base: string = import.meta.env.BASE_URL,
): string {
  const safe = defaultUrlTransform(url)
  if (
    !safe ||
    safe.startsWith('#') ||
    safe.startsWith('//') ||
    /^[a-z][a-z0-9+.-]*:/i.test(safe)
  )
    return safe
  const path = safe.replace(/^\.\//, '').replace(/^\//, '')
  const prefix = base.endsWith('/') ? base : `${base}/`
  return `${prefix}${path}`
}
