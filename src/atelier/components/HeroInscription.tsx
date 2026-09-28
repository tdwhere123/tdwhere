import { Link } from 'react-router-dom'
import { useLang } from '@/context/LangContext'
import { useWords } from '../hooks'

const studies = [
  {
    name: ['记忆', 'Memory'] as const,
    to: '/alaya',
    project: 'Alaya',
    note: [
      '什么值得留下，又该在何时被想起。',
      'What deserves to remain, and when it should return.',
    ] as const,
  },
  {
    name: ['行动', 'Action'] as const,
    to: '/do-it',
    project: 'do-it',
    note: [
      '从意图到交付，每一步都留下可以检查的依据。',
      'From intention to delivery, every step leaves evidence you can check.',
    ] as const,
  },
  {
    name: ['表达', 'Expression'] as const,
    to: '/write-right',
    project: 'Write-Right',
    note: ['先有材料与目的，再有措辞。', 'Material and purpose first; the wording follows.'] as const,
  },
]

export function HeroInscription({
  index,
  onAdvance,
}: {
  index: number
  onAdvance: (from: HTMLElement) => void
}) {
  const w = useWords()
  const { lang } = useLang()
  const current = studies[index] ?? studies[0]
  const next = studies[(index + 1) % studies.length]
  const name = lang === 'zh' ? current.name[0] : current.name[1]
  const nextName = lang === 'zh' ? next.name[0] : next.name[1]
  return (
    <div className="a-hero-inscription">
      <button
        type="button"
        className="a-hero-inscription-word"
        lang={lang}
        aria-label={w(
          `${name}。点按换到${nextName}`,
          `${name}. Turn to ${nextName}`,
        )}
        onClick={(e) => onAdvance(e.currentTarget)}
      >
        <small>0{index + 1}</small>
        <span key={`${lang}-${index}`}>{name}</span>
      </button>
      <p>{lang === 'zh' ? current.note[0] : current.note[1]}</p>
      <Link to={current.to}>
        {current.project}
        <span aria-hidden="true"> →</span>
      </Link>
      <span className="a-hero-inscription-hint">
        {w('点按字，换下一方向', 'Press the word for the next direction')}
      </span>
    </div>
  )
}
