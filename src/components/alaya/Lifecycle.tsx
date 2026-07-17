import { useLang } from '@/context/LangContext'
import { alayaContent } from '@/content/alaya'
import InkReveal from '@/components/InkReveal'
import Kicker from '@/components/Kicker'
import LifecycleRing from './LifecycleRing'
import GateDemo from './GateDemo'

/** S4 · The Lifecycle — six stages ring + gate demo (the core interaction). */
export default function Lifecycle() {
  const { lang } = useLang()
  const a = alayaContent[lang].lifecycle
  return (
    <section
      id="lifecycle"
      className="border-y border-hairline bg-museum-stone/55"
      aria-label={a.title}
    >
      <div className="mx-auto max-w-demo px-5 py-24 md:px-10 md:py-32">
        <InkReveal amount={0.5}>
          <Kicker>{a.kicker}</Kicker>
        </InkReveal>
        <InkReveal amount={0.4} delay={0.08}>
          <h2 className="mt-6 font-serif text-h2 font-semibold text-ink">{a.title}</h2>
          <p className="mt-3 max-w-reading text-ink-3">{a.sub}</p>
        </InkReveal>
        <div className="mt-12">
          <LifecycleRing />
        </div>
        <GateDemo />
      </div>
    </section>
  )
}
