import { Link, useParams } from 'react-router-dom'
import { useLang } from '@/context/LangContext'
import { blogContent } from '@/content/blog'
import { getPost, getPostBody } from '@/content/posts'
import MarkdownRenderer from '@/components/blog/Markdown'
import NotFound from '@/pages/NotFound'

/** /blog/:slug — 单篇文章. Unknown or body-less slugs fall back to the 404 page. */
export default function BlogPost() {
  const { lang } = useLang()
  const { slug } = useParams<{ slug: string }>()
  const c = blogContent[lang]
  const post = slug ? getPost(slug) : undefined
  const body = slug ? getPostBody(slug) : undefined

  if (!post || !body) return <NotFound />

  return (
    <div className="mx-auto max-w-shell px-5 pb-24 pt-20 md:px-10">
      <Link
        to="/blog"
        className="font-mono text-xs text-ink-3 transition-colors duration-300 hover:text-cobalt"
      >
        ← {c.backList}
      </Link>

      <article>
        <h1 className="mt-10 font-display text-[clamp(28px,4vw,44px)] font-semibold leading-snug text-ink">
          {post.title}
        </h1>
        <p className="mt-5 font-mono text-xs text-faint">
          {c.published} <time dateTime={post.date}>{post.date}</time>
          {post.tags.length > 0 && (
            <span className="ml-3 uppercase tracking-[0.12em]">{post.tags.join(' · ')}</span>
          )}
        </p>

        <div className="mt-10 border-t border-hairline pt-10">
          <MarkdownRenderer content={body} />
        </div>

        <footer className="mt-16 border-t border-hairline pt-6">
          <p className="font-mono text-xs text-faint">{c.originalNote}</p>
          <a
            href={post.source}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block font-mono text-xs text-cobalt transition-colors duration-300 hover:text-cobalt-deep"
          >
            {c.originalLink} ↗
          </a>
        </footer>
      </article>
    </div>
  )
}
