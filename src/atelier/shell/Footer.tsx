import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUp, ArrowUpRight, Check, Copy } from 'lucide-react'
import { useLang } from '@/context/LangContext'
import { useWords } from '../hooks'
export default function Footer() {
  const w = useWords(),
    { t } = useLang(),
    [status, setStatus] = useState(''),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )
  async function copy() {
    try {
      await navigator.clipboard.writeText(t.meta.email)
      setStatus('copied')
    } catch {
      setStatus('error')
    }
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setStatus(''), 3000)
  }
  return (
    <footer className="a-footer">
      <div className="a-footer-top">
        <p>
          {w('问题会继续，', 'The questions continue.')}
          <br />
          <em>{w('我们也继续。', 'So do we.')}</em>
        </p>
        <div>
          <a href={`mailto:${t.meta.email}`}>
            {t.meta.email}
            <ArrowUpRight size={15} />
          </a>
          <button onClick={copy} aria-label={w('复制邮箱', 'Copy email')}>
            {status === 'copied' ? <Check size={15} /> : <Copy size={15} />}
          </button>
          <small aria-live="polite">
            {status === 'copied'
              ? w('已复制', 'Copied')
              : status === 'error'
                ? w('请使用邮箱链接。', 'Please use the email link.')
                : w(
                    '关于想法、项目，或者下一次对谈。',
                    'Ideas, projects, or the next conversation.',
                  )}
          </small>
        </div>
      </div>
      <div className="a-footer-signature" aria-hidden="true">
        tdwhere.
      </div>
      <div className="a-colophon">
        <span>© {new Date().getFullYear()} 阿黄 · tdwhere</span>
        <a href={t.meta.githubUrl} target="_blank" rel="noreferrer">
          GitHub / tdwhere123
        </a>
        <Link to="/playground">
          {w('还有一些未完成的尝试', 'Some unfinished experiments')} ↗
        </Link>
        <button
          aria-label={w('回到顶部', 'Back to top')}
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
                ? 'auto'
                : 'smooth',
            })
          }
        >
          <ArrowUp size={16} />
        </button>
      </div>
    </footer>
  )
}
