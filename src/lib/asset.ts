/** Prefix a file from `public/` with the Vite base URL (needed on GitHub Pages). */
export function asset(path: string): string {
  const base = import.meta.env.BASE_URL
  const normalized = path.replace(/^\//, '')
  return `${base}${normalized}`
}
