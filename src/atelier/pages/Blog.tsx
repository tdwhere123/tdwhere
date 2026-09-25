import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Search, X } from 'lucide-react'
import { posts } from '@/content/posts'
import { useWords } from '../hooks'
import { Art, Caption } from '../components/Primitives'
export default function Blog() {
  const w = useWords(),
    [search, setSearch] = useState(''),
    [tag, setTag] = useState('all'),
    tags = useMemo(() => ['all', ...new Set(posts.flatMap((p) => p.tags))], [])
  const visible = posts.filter(
    (p) =>
      (tag === 'all' || p.tags.includes(tag)) &&
      `${p.title} ${p.summary} ${p.tags.join(' ')}`
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
  )
  return (
    <div className="a-blog">
      <header className="a-notes-hero">
        <Art name="manuscript" eager />
        <Caption>ESSAYS / OBSERVATIONS / UNFINISHED QUESTIONS</Caption>
        <h1>
          Field
          <br />
          <em>notes.</em>
        </h1>
        <p>
          {w(
            '有些是思考，有些是反思。',
            'Some thoughts. Some second thoughts.',
          )}
          <br />
          {w(
            '都是问题经过这里的痕迹。',
            'All are traces of questions passing through.',
          )}
        </p>
        <span className="a-notes-hand" aria-hidden="true">
          not a final answer.
        </span>
      </header>
      <section className="a-archive">
        <div className="a-archive-controls">
          <label className="a-search">
            <Search size={17} aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={w('在手记里寻找……', 'Look through the notes…')}
              aria-label={w('搜索文章', 'Search notes')}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                aria-label={w('清空搜索', 'Clear search')}
              >
                <X size={14} />
              </button>
            )}
          </label>
          <div
            className="a-archive-tags"
            role="group"
            aria-label={w('文章主题', 'Article topics')}
          >
            {tags.map((t) => (
              <button
                key={t}
                aria-pressed={tag === t}
                onClick={() => setTag(t)}
              >
                {t === 'all' ? w('全部', 'All') : t}
              </button>
            ))}
          </div>
        </div>
        <p className="a-archive-count" aria-live="polite">
          {String(visible.length).padStart(2, '0')} {w('篇手记', 'notes')} ·{' '}
          {w('文章保留原始中文', 'Essays remain in their original Chinese')}
        </p>
        <div>
          {visible.map((p, i) => (
            <Link
              className="a-archive-entry"
              key={p.slug}
              to={`/blog/${p.slug}`}
            >
              <span className="a-entry-index">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <time dateTime={p.date}>{p.date.replaceAll('-', '.')}</time>
                <h2 lang="zh">{p.title}</h2>
                <p lang="zh">{p.summary}</p>
                <small>{p.tags.join(' / ')}</small>
              </div>
              <ArrowUpRight size={23} />
            </Link>
          ))}
        </div>
        {visible.length === 0 && (
          <div className="a-empty-state">
            <p>{w('这里暂时没有这条线索。', 'No matching trace here yet.')}</p>
            <button
              className="a-link"
              onClick={() => {
                setSearch('')
                setTag('all')
              }}
            >
              {w('回到全部手记', 'Return to all notes')}
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
