import { useEffect, useMemo, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import ReactMarkdown, { defaultUrlTransform } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { getPost, getPostBody } from '@/content/posts'
import { asset } from '@/lib/asset'
import { useWords } from '../hooks'
import { Caption } from '../components/Primitives'
import NotFound from './NotFound'
function headings(body: string) {
  let fence = '',
    n = 0
  const items: { id: string; line: number; title: string; level: number }[] = []
  body.split('\n').forEach((line, index) => {
    const mark = line.match(/^ {0,3}(`{3,}|~{3,})/)
    if (mark) {
      if (!fence) fence = mark[1][0]
      else if (fence === mark[1][0]) fence = ''
      return
    }
    if (fence) return
    const h = line.match(/^ {0,3}(#{2,3})\s+(.+?)\s*#*\s*$/)
    if (h)
      items.push({
        id: `section-${++n}`,
        line: index + 1,
        title: h[2]
          .replace(/[*_`]/g, '')
          .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1'),
        level: h[1].length,
      })
  })
  return items
}
export default function Article() {
  const { slug = '' } = useParams()
  const post = getPost(slug)
  const body = getPostBody(slug) ?? ''
  const w = useWords()
  const progress = useRef<HTMLDivElement>(null)
  const article = useRef<HTMLDivElement>(null)
  const toc = useMemo(() => headings(body), [body])
  const positions = useMemo(
    () => new Map(toc.map((h) => [h.line, h.id])),
    [toc],
  )
  useEffect(() => {
    if (post) document.title = `${post.title} · tdwhere`
    let frame = 0
    const update = () => {
      frame = 0
      const e = article.current
      if (!e || !progress.current) return
      const start = e.getBoundingClientRect().top + scrollY - 120,
        total = Math.max(1, e.offsetHeight - innerHeight + 200)
      progress.current.style.scale = `${Math.max(0, Math.min(1, (scrollY - start) / total))} 1`
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    update()
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [post])
  if (!post || !body) return <NotFound />
  return (
    <article className="a-essay">
      <div className="a-reading-progress" ref={progress} aria-hidden="true" />
      <header className="a-essay-header">
        <Link to="/blog" className="a-back">
          <ArrowLeft size={14} />
          {w('回到手记', 'Back to notes')}
        </Link>
        <Caption>
          {post.date.replaceAll('-', '.')} / {post.tags.join(' · ')}
        </Caption>
        <h1 lang="zh">{post.title}</h1>
        <p className="a-essay-deck" lang="zh">
          {post.summary}
        </p>
        <div className="a-essay-byline">
          <span>阿黄 / tdwhere</span>
          <a href={post.source} target="_blank" rel="noreferrer">
            {w('原始发表', 'Original publication')}
            <ArrowUpRight size={13} />
          </a>
        </div>
      </header>
      <div className="a-reading-layout">
        <aside className="a-toc">
          <Caption>{w('沿着这篇文章', 'IN THIS NOTE')}</Caption>
          <nav aria-label={w('文章目录', 'Table of contents')}>
            {toc.map((h) => (
              <a key={h.id} href={`#${h.id}`} data-level={h.level}>
                {h.title}
              </a>
            ))}
          </nav>
          <p>
            {w(
              '正文保留原文；这里只改变排印。',
              'The original text is preserved; only its presentation changes.',
            )}
          </p>
        </aside>
        <div className="a-prose" lang="zh" ref={article}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            urlTransform={(url) => {
              const safe = defaultUrlTransform(url)
              return safe.startsWith('/') && !safe.startsWith('//')
                ? asset(safe.slice(1))
                : safe
            }}
            components={{
              h2: ({ node, children, ...props }) => (
                <h2
                  {...props}
                  id={positions.get(node?.position?.start.line ?? -1)}
                >
                  {children}
                </h2>
              ),
              h3: ({ node, children, ...props }) => (
                <h3
                  {...props}
                  id={positions.get(node?.position?.start.line ?? -1)}
                >
                  {children}
                </h3>
              ),
              img: ({ src, alt }) => (
                <span className="a-figure">
                  <img
                    src={src}
                    alt={alt || ''}
                    loading="lazy"
                    decoding="async"
                  />
                  {alt && <span className="a-figcaption">{alt}</span>}
                </span>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  target={href?.startsWith('http') ? '_blank' : undefined}
                  rel={href?.startsWith('http') ? 'noreferrer' : undefined}
                >
                  {children}
                </a>
              ),
            }}
          >
            {body}
          </ReactMarkdown>
        </div>
      </div>
      <footer className="a-essay-end">
        <span className="a-handwritten">to be continued.</span>
        <Link to="/blog" className="a-link">
          {w('继续翻阅', 'Keep reading')}
          <ArrowUpRight size={16} />
        </Link>
      </footer>
    </article>
  )
}
