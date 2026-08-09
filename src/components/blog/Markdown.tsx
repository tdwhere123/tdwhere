import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import type { ReactNode } from 'react'
import { asset } from '@/lib/asset'
import useCopyText from '@/hooks/useCopyText'
import { useLang } from '@/context/LangContext'
import { blogContent } from '@/content/blog'

function codeText(children: ReactNode): string {
  if (typeof children === 'string') return children
  if (Array.isArray(children)) return children.map((c) => (typeof c === 'string' ? c : '')).join('')
  return String(children ?? '')
}

function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const { lang: uiLang } = useLang()
  const c = blogContent[uiLang]
  const { copied, copy } = useCopyText(code)
  return (
    <div className="group/code relative my-6">
      <pre className="overflow-x-auto rounded-xl bg-night p-4 text-[13px] leading-relaxed text-paper">
        {lang ? (
          <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.12em] text-paper/40">
            {lang}
          </span>
        ) : null}
        <code className="font-mono">{code}</code>
      </pre>
      <button
        type="button"
        onClick={copy}
        className="absolute right-3 top-3 rounded-md border border-paper/20 px-2 py-1 font-mono text-[10px] text-paper/50 transition-colors duration-300 hover:text-paper"
      >
        {copied ? c.copied : c.copy}
      </button>
    </div>
  )
}

/**
 * 文章正文渲染器 — post markdown bodies in the site's ink-paper typography.
 * Images resolve through asset() (GitHub Pages base); fenced code renders as a
 * copyable night block; $…$/$$…$$ math renders via KaTeX (katex CSS included).
 */
export default function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="article-body mx-auto max-w-reading font-serif">
      <Markdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
        // Unwrap the default <pre> so fenced code owns its block styling.
        pre: ({ children }) => <>{children}</>,
        code: ({ children, className }) => {
          const lang = /language-(\w+)/.exec(className ?? '')?.[1]
          if (lang) return <CodeBlock code={codeText(children)} lang={lang} />
          return (
            <code className="rounded-md bg-paper-deep px-1.5 py-0.5 font-mono text-[0.85em] text-ink-2">
              {children}
            </code>
          )
        },
        img: ({ src, alt }) => (
          <img src={asset(src ?? '')} alt={alt ?? ''} loading="lazy" className="my-8 rounded-xl" />
        ),
        h2: ({ children }) => (
          <h2 className="mb-4 mt-14 font-display text-[clamp(22px,2.6vw,30px)] font-semibold leading-snug text-ink">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="mb-3 mt-10 font-display text-[clamp(18px,2vw,22px)] font-semibold leading-snug text-ink">{children}</h3>
        ),
        h4: ({ children }) => (
          <h4 className="mb-2 mt-8 font-display text-lg font-semibold leading-snug text-ink">{children}</h4>
        ),
        p: ({ children }) => (
          <p className="my-5 text-[16px] leading-[2] text-ink-2">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="my-5 list-disc space-y-2 pl-6 text-[16px] leading-[1.9] text-ink-2">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="my-5 list-decimal space-y-2 pl-6 text-[16px] leading-[1.9] text-ink-2">
            {children}
          </ol>
        ),
        blockquote: ({ children }) => (
          <blockquote className="my-6 border-l-2 border-cobalt pl-5 text-[15px] leading-[1.9] text-ink-3">
            {children}
          </blockquote>
        ),
        a: ({ href, children }) => (
          <a href={href} className="text-cobalt underline underline-offset-4 hover:text-cobalt-deep">
            {children}
          </a>
        ),
        table: ({ children }) => (
          <div className="my-6 overflow-x-auto">
            <table className="w-full border-collapse text-[14px] text-ink-2">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border-b border-hairline px-3 py-2 text-left font-mono text-xs text-faint">
            {children}
          </th>
        ),
        td: ({ children }) => <td className="border-b border-hairline px-3 py-2">{children}</td>,
        hr: () => <hr className="my-10 border-hairline" />,
      }}
      >
        {content}
      </Markdown>
    </div>
  )
}
