import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { useWords } from '../hooks'
import { Art } from '../components/Primitives'
import type { ArtName } from '../paint/presets'
import sentinel from '@/assets/projects/sentinel.webp'

type Words = [string, string]
/** Each project shows a painting behind the index: procedural (`art`) or a picture of the thing itself (`image`). */
const projects: ({ to: string; name: string; kind: Words; line: Words } & ({ art: ArtName } | { image: string }))[] = [
  {
    to: '/alaya',
    art: 'pigment',
    name: 'Alaya',
    kind: ['Agent 记忆', 'Agent memory'],
    line: [
      '对话像雨水落下。研究它们如何被留下、彼此关联，又带着来处回到此刻。',
      'Conversations fall like rain. How they are kept, how they connect, and how they return carrying where they came from.',
    ],
  },
  {
    to: '/do-it',
    art: 'construction',
    name: 'do-it',
    kind: ['Agent 插件', 'Agent plugin'],
    line: [
      '给编程 Agent 的专业判断。不加流程，只在要紧处出声，用证据说完成。',
      'Professional judgment for coding agents. No added process; it speaks where it matters, and claims done with evidence.',
    ],
  },
  {
    to: '/sentinel',
    // the painted machine, switched on
    image: sentinel,
    name: 'SENTINEL',
    kind: ['叙事游戏 · 一夜', 'Narrative game · one night'],
    line: [
      '所有的信息都来自它。你是最后一位人类审查员，要在天亮前写下一次停电的正式记录。',
      'Everything you know comes from it. As the last human reviewer, you have until dawn to write the record of an outage.',
    ],
  },
  {
    to: '/playground#veggie',
    art: 'landscape',
    name: 'Vegetarian-card',
    kind: ['产品尝试 · 早期', 'Product sketch · early'],
    line: ['从一张素食卡片开始。', 'It began with a recipe card.'],
  },
]

/**
 * Projects as a plain index, one row each. Pointing at a row brings that
 * project's painting up faintly behind the page.
 */
export default function Projects() {
  const w = useWords()
  const [shown, setShown] = useState<number | null>(null)
  return (
    <div className="a-index">
      <div className="a-index-art" aria-hidden="true">
        {projects.map((p, i) => (
          <div key={p.to} data-on={shown === i ? '' : undefined}>
            {'image' in p ? (
              <img className="a-art a-index-picture" src={p.image} alt="" draggable={false} />
            ) : (
              <Art name={p.art} still />
            )}
          </div>
        ))}
      </div>
      <header className="a-index-head">
        <h1>{w('项目', 'Projects')}</h1>
        <p>
          {w(
            '每一次探索单独成行。记忆是其中之一，后面还会有更多。',
            'Each line of inquiry gets a row. Memory is one of them; more will follow.',
          )}
        </p>
      </header>
      <ol className="a-index-list">
        {projects.map((p, i) => (
          <li key={p.to}>
            <Link
              to={p.to}
              onPointerEnter={() => setShown(i)}
              onPointerLeave={() => setShown(null)}
              onFocus={() => setShown(i)}
              onBlur={() => setShown(null)}
            >
              <span className="a-index-n">{String(i + 1).padStart(2, '0')}</span>
              <strong>{p.name}</strong>
              <span className="a-index-kind">{w(...p.kind)}</span>
              <span className="a-index-line">{w(...p.line)}</span>
              <ArrowUpRight size={20} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ol>
    </div>
  )
}
