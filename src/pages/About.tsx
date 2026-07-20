import Hero from '@/components/about/Hero'
import QaSection from '@/components/about/QaSection'
import Trail from '@/components/about/Trail'
import Contact from '@/components/about/Contact'
import Attitude from '@/components/about/Attitude'

/**
 * 关于 · About — 「园丁其人」
 * S1 The Gardener (gate-open hero) → S2 Asking Myself (accordion)
 * → S3 The Trail (scrubbed timeline) → S4 Say Hello → S5 The Attitude.
 */
export default function About() {
  return (
    <div className="bg-museum-bg text-museum-ink">
      <Hero />
      <QaSection />
      <Trail />
      <Contact />
      <Attitude />
    </div>
  )
}
