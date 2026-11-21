import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { useWords } from '../hooks'
import { Art } from '../components/Primitives'
import { projects } from '../projects'

/**
 * Projects as a plain index, one row each. Pointing at a row brings that
 * project's painting up faintly behind the page.
 */
export default function Projects() {
  const w = useWords()
  const [shown, setShown] = useState<number | null>(null)
  const [visited, setVisited] = useState<number[]>([])
  const show = (index: number) => {
    setShown(index)
    setVisited((seen) => seen.includes(index) ? seen : [...seen, index])
  }
  return (
    <div className="a-index">
      <div className="a-index-art" aria-hidden="true">
        {projects.map((p, i) => (
          <div key={p.to} data-on={shown === i ? '' : undefined}>
            {visited.includes(i) && ('image' in p ? (
              <img className="a-art a-index-picture" src={p.image} alt="" draggable={false} />
            ) : (
              <Art name={p.art} still />
            ))}
          </div>
        ))}
      </div>
      <header className="a-index-head">
        <h1 data-rise>{w('项目', 'Projects')}</h1>
        <p data-fade="0.2">
          {w(
            '我正在做和做过的几件事。大多和 AI agent 有关。',
            'Things I am making, or have made. Most of them are about AI agents.',
          )}
        </p>
      </header>
      <ol className="a-index-list">
        {projects.map((p, i) => (
          <li key={p.to} data-fade={i * 0.08}>
            <Link
              to={p.to}
              onPointerEnter={() => show(i)}
              onPointerLeave={() => setShown(null)}
              onFocus={() => show(i)}
              onBlur={() => setShown(null)}
            >
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
