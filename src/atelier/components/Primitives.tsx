import { useEffect, useRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { asset } from '@/lib/asset'
import { useWords } from '../hooks'

export function Art({
  name = 'landscape',
  className = '',
  eager = false,
}: {
  name?: string
  className?: string
  eager?: boolean
}) {
  return (
    <img
      className={`a-art ${className}`}
      src={asset(`atelier/${name}.webp`)}
      alt=""
      aria-hidden="true"
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
    />
  )
}
export function LinkLine({
  to,
  children,
  external = false,
}: {
  to: string
  children: ReactNode
  external?: boolean
}) {
  const inner = (
    <>
      {children}
      <ArrowUpRight size={18} aria-hidden="true" />
    </>
  )
  return external ? (
    <a className="a-link" href={to} target="_blank" rel="noreferrer">
      {inner}
    </a>
  ) : (
    <Link className="a-link" to={to}>
      {inner}
    </Link>
  )
}
export function Caption({
  number,
  children,
}: {
  number?: string
  children: ReactNode
}) {
  return (
    <p className="a-caption">
      {number && <span>{number}</span>}
      {children}
    </p>
  )
}
export function Reveal({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (
      !el ||
      !('IntersectionObserver' in window) ||
      matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-seen')
          observer.disconnect()
        }
      },
      { threshold: 0.07 },
    )
    el.classList.add('a-reveal-ready')
    observer.observe(el)
    return () => {
      observer.disconnect()
      el.classList.remove('a-reveal-ready')
    }
  }, [])
  return (
    <div ref={ref} className={`a-reveal ${className}`}>
      {children}
    </div>
  )
}
export function NextProject({
  name,
  to,
  note,
}: {
  name: string
  to: string
  note: string
}) {
  const w = useWords()
  return (
    <section className="a-next">
      <Caption>{w('接着探索', 'Keep exploring')}</Caption>
      <Link to={to}>
        <span>{name}</span>
        <ArrowUpRight aria-hidden="true" />
      </Link>
      <p>{note}</p>
    </section>
  )
}
export function DemoNote() {
  const w = useWords()
  return (
    <p className="a-demo-note">
      {w(
        '交互机制示意 · 固定样例 · 不调用模型，也不运行项目后端',
        'Interactive mechanism study · fixed examples · no model or project backend calls',
      )}
    </p>
  )
}
