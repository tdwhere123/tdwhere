import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Search, X } from 'lucide-react'
import { posts } from '@/content/posts'
import { useWords } from '../hooks'

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
        <h1 data-rise>{w('手记', 'Notes')}</h1>
        <p data-fade="0.2">
          {w(
            '关于 AI、记忆和学习方法的文章，也有几篇小说。翻到下一篇时，这一页会被烧掉。',
            'Essays on AI, memory and how I learn, and a few stories. Turning to the next one burns the page.',
          )}
        </p>
      </header>
      <section className="a-archive">
        <div className="a-archive-controls">
          <label className="a-search">
            <Search size={17} aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={w('搜索手记', 'Search notes')}
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
          {w(`${visible.length} 篇`, `${visible.length} notes`)} ·{' '}
          {w('文章保留原始中文', 'Essays remain in their original Chinese')}
        </p>
        <div>
          {visible.map((p) => (
            <Link
              className="a-archive-entry"
              key={p.slug}
              to={`/blog/${p.slug}`}
            >
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
            <p>{w('没有找到符合的手记。', 'No notes match.')}</p>
            <button
              className="a-link"
              onClick={() => {
                setSearch('')
                setTag('all')
              }}
            >
              {w('显示全部手记', 'Show all notes')}
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
