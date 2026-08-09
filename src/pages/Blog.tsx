import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { useLang } from '@/context/LangContext'
import { blogContent } from '@/content/blog'
import { posts } from '@/content/posts'
import { ZEN } from '@/lib/motion'

/** /blog — 随笔列表. Order comes from posts.ts (date desc, newest first). */
export default function Blog() {
  const { lang } = useLang()
  const c = blogContent[lang]
  const reduce = useReducedMotion()

  return (
    <div className="mx-auto max-w-shell px-5 pb-24 pt-20 md:px-10">
      <header className="mb-12 md:mb-16">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-museum-muted">
          {c.kicker}
        </p>
        <h1 className="mt-4 font-display text-h2 font-semibold text-ink">{c.title}</h1>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-3">{c.subtitle}</p>
      </header>

      {posts.length === 0 ? (
        <p className="text-[15px] text-ink-3">{c.empty}</p>
      ) : (
        <ol>
          {posts.map((post, order) => (
            <motion.li
              key={post.slug}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, ease: ZEN, delay: reduce ? 0 : order * 0.05 }}
            >
              <Link
                to={`/blog/${post.slug}`}
                className="group flex items-start justify-between gap-5 border-b border-hairline py-7"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-4">
                    <span className="shrink-0 font-mono text-xs text-faint">{post.date}</span>
                    <h2 className="truncate font-display text-xl font-semibold leading-snug text-museum-ink transition-colors duration-300 group-hover:text-cobalt md:text-2xl">
                      {post.title}
                    </h2>
                  </div>
                  <p className="mt-2 max-w-[46ch] text-[14px] leading-relaxed text-museum-muted">
                    {post.summary}
                  </p>
                  {post.tags.length > 0 && (
                    <p className="mt-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
                      {post.tags.join(' · ')}
                    </p>
                  )}
                </div>
                <span className="mt-1 flex shrink-0 items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-cobalt">
                  {c.readMore}
                  <ArrowUpRight
                    className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                </span>
              </Link>
            </motion.li>
          ))}
        </ol>
      )}
    </div>
  )
}
