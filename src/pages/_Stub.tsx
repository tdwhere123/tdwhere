import { Link } from 'react-router-dom'
import { useLang } from '@/context/LangContext'
import Kicker from '@/components/Kicker'

/**
 * Temporary placeholder for pages owned by other agents.
 * Replace the whole page file — do not build on top of this stub.
 */
export default function Stub({
  kicker,
  title,
  accent = 'var(--tea)',
}: {
  kicker: string
  title: string
  accent?: string
}) {
  const { lang } = useLang()
  return (
    <div className="mx-auto flex min-h-[70dvh] max-w-shell flex-col justify-center px-5 py-24 md:px-10">
      <Kicker>{kicker}</Kicker>
      <h1 className="mt-6 font-serif text-h1 font-semibold" style={{ color: accent }}>
        {title}
      </h1>
      <p className="mt-6 max-w-reading text-ink-3">
        {lang === 'zh'
          ? '这间屋子正在打扫，很快开门。'
          : 'This room is being tidied. It opens soon.'}
      </p>
      <Link
        to="/"
        className="group relative mt-10 w-fit font-mono text-sm text-ink-3 transition-colors duration-300 hover:text-ink"
      >
        {lang === 'zh' ? '← 回到院子' : '← Back to the garden'}
        <span
          aria-hidden="true"
          className="absolute -bottom-0.5 left-0 h-px w-0 bg-ink transition-all duration-300 ease-zen group-hover:w-full"
        />
      </Link>
    </div>
  )
}
