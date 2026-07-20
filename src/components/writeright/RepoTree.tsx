import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLang } from '@/context/LangContext'
import { writeRightContent } from '@/content/writeRight'
import Kicker from '@/components/Kicker'
import InkReveal from '@/components/InkReveal'
import { cn } from '@/lib/utils'

const ZEN = [0.22, 1, 0.36, 1] as [number, number, number, number]

/**
 * S4 · 仓库形状 — interactive file tree. Desktop: tree left / note panel right.
 * Mobile: accordion. core/ is the single source of truth.
 */
export default function RepoTree() {
  const { lang } = useLang()
  const c = writeRightContent[lang].repo
  const [active, setActive] = useState('core')
  const activeNode = c.nodes.find((n) => n.id === active) ?? c.nodes[0]

  return (
    <section className="bg-museum-stone/55">
      <div className="mx-auto max-w-shell px-5 py-[clamp(72px,12vh,128px)] md:px-10">
        <InkReveal>
          <Kicker>{c.kicker}</Kicker>
          <h2 className="mt-4 font-serif text-h2 font-semibold text-ink">{c.title}</h2>
        </InkReveal>

        {/* ——— desktop: tree + note panel ——— */}
        <div className="mt-12 hidden gap-12 md:grid md:grid-cols-2">
          <div role="list" aria-label={c.title}>
            {c.nodes.map((node, i) => (
              <motion.div
                key={node.id}
                role="listitem"
                initial={{ x: -16, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.45, ease: ZEN, delay: i * 0.05 }}
              >
                <button
                  type="button"
                  aria-pressed={active === node.id}
                  onClick={() => setActive(node.id)}
                  className={cn(
                    'group relative w-full px-4 py-2.5 text-left font-mono text-sm transition-colors duration-300',
                    active === node.id
                      ? 'bg-[color-mix(in_srgb,var(--dai)_9%,transparent)] text-ink'
                      : 'text-ink-3 hover:text-ink',
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute left-0 top-1.5 h-[calc(100%-0.75rem)] w-[2px] origin-top bg-dai transition-transform duration-200 ease-zen',
                      active === node.id ? 'scale-y-100' : 'scale-y-0 group-hover:scale-y-100',
                    )}
                  />
                  {node.label}
                  {node.tag && <span className="ml-3 text-xs text-faint">← {node.tag}</span>}
                </button>
                {node.children.length > 0 && (
                  <div className="space-y-0.5 py-1 pl-8 font-mono text-xs leading-relaxed text-faint">
                    {node.children.map((child, ci) => (
                      <p key={child}>
                        {ci === node.children.length - 1 ? '└─' : '├─'} {child}
                      </p>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* note panel — interactive surface, hairline only */}
          <div className="relative">
            <div className="sticky top-24 min-h-[180px] border border-museum-line bg-museum-bg/70 p-7">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activeNode.id}-${lang}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                  transition={{ duration: 0.3, ease: ZEN }}
                >
                  <p className="font-mono text-sm text-dai">{activeNode.label}</p>
                  <p className="mt-4 font-serif text-xl leading-relaxed text-ink">
                    {activeNode.note}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ——— mobile: accordion ——— */}
        <div className="mt-10 space-y-1 md:hidden">
          {c.nodes.map((node, i) => {
            const open = active === node.id
            return (
              <motion.div
                key={node.id}
                initial={{ x: -16, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.45, ease: ZEN, delay: i * 0.05 }}
                className={cn(
                  'border transition-colors duration-300',
                  open
                    ? 'border-dai bg-museum-bg/70'
                    : 'border-museum-line',
                )}
              >
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setActive(open ? '' : node.id)}
                  className="w-full px-4 py-3 text-left font-mono text-sm text-ink"
                >
                  {node.label}
                  {node.tag && (
                    <span className="ml-2 text-xs text-faint">← {node.tag}</span>
                  )}
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: ZEN }}
                      className="overflow-hidden"
                    >
                      <p className="px-4 pb-4 text-sm leading-relaxed text-ink-3">{node.note}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
