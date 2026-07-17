import { useLang } from '@/context/LangContext'
import { doItContent } from '@/content/doIt'
import Kicker from '@/components/Kicker'
import InkReveal from '@/components/InkReveal'

/** S4 · 四步功法 — four panels; hover lifts, the big numeral fills with clay. */
export default function FourMoves() {
  const { lang } = useLang()
  const c = doItContent[lang].moves

  return (
    <section className="mx-auto max-w-shell px-5 py-[clamp(72px,12vh,128px)] md:px-10">
      <InkReveal>
        <Kicker>{c.kicker}</Kicker>
      </InkReveal>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {c.items.map((item, i) => (
          <InkReveal key={item.en} delay={i * 0.12} className="h-full">
            <div className="group relative h-full border border-hairline bg-museum-stone/50 p-6 transition-transform duration-300 ease-zen hover:-translate-y-1">
              {i === 3 && (
                <span className="absolute right-4 top-4 border border-museum-brass/35 bg-paper px-2.5 py-0.5 font-mono text-[10px] text-museum-brass">
                  {c.learnBadge}
                </span>
              )}

              {/* big numeral — stroked outline that fills on hover */}
              <span aria-hidden="true" className="relative block h-14 font-serif text-5xl font-bold leading-none">
                <span
                  className="text-transparent"
                  style={{ WebkitTextStroke: '1.5px var(--clay)' }}
                >
                  {i + 1}
                </span>
                <span className="absolute inset-0 text-clay transition-[clip-path] duration-300 ease-zen [clip-path:inset(100%_0_0_0)] group-hover:[clip-path:inset(0_0_0_0)]">
                  {i + 1}
                </span>
              </span>

              <p className="mt-4 font-mono text-[13px] uppercase tracking-[0.1em] text-clay">
                {item.en}
              </p>
              <h3 className="mt-1.5 font-serif text-xl font-semibold text-ink">{item.zh}</h3>
              <p className="mt-3 text-sm leading-[1.85] text-ink-3">{item.desc}</p>
            </div>
          </InkReveal>
        ))}
      </div>
    </section>
  )
}
