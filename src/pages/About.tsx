import { useLang } from '@/context/LangContext'
import { aboutContent } from '@/content/about'
import Hero from '@/components/about/Hero'
import QaSection from '@/components/about/QaSection'
import Trail from '@/components/about/Trail'
import Contact from '@/components/about/Contact'
import Attitude from '@/components/about/Attitude'
import IllustrationPlate from '@/components/IllustrationPlate'

/**
 * 关于 · About — 「园丁其人」
 * S1 The Gardener → S2 Asking Myself → plate → S3 The Trail → S4 Say Hello → S5 Attitude.
 */
export default function About() {
  const { lang } = useLang()
  const plate = aboutContent[lang].plate

  return (
    <div className="bg-museum-bg text-museum-ink">
      <Hero />
      <QaSection />
      <IllustrationPlate
        src="illustrations/about-garden-workbench.png"
        alt={plate.alt}
        kicker={plate.kicker}
        caption={plate.caption}
        variant="wide"
      />
      <Trail />
      <Contact />
      <Attitude />
    </div>
  )
}
