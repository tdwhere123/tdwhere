import { useLang } from '@/context/LangContext'
import { doItContent } from '@/content/doIt'
import NextProject from '@/components/NextProject'
import BrassRule from '@/components/doit/BrassRule'
import DoItHero from '@/components/doit/DoItHero'
import WhySection from '@/components/doit/WhySection'
import RouterSimulator from '@/components/doit/RouterSimulator'
import FourMoves from '@/components/doit/FourMoves'
import DecisionLadder from '@/components/doit/DecisionLadder'
import SpecsCredits from '@/components/doit/SpecsCredits'

/**
 * /do-it — 流程之屋 · project page.
 * S1 hero · S2 why · S3 router simulator · S4 four moves · S5 decision ladder
 * · S6 specs & credits · S7 next room.
 */
export default function DoIt() {
  const { lang } = useLang()
  const c = doItContent[lang]

  return (
    <>
      <DoItHero />

      <div aria-hidden="true" className="mx-auto max-w-shell px-5 md:px-10">
        <BrassRule className="mx-auto h-2 w-40" />
      </div>

      <WhySection />
      <RouterSimulator />
      <FourMoves />
      <DecisionLadder />
      <SpecsCredits />

      <NextProject to="/alaya" title={c.next.title} subtitle={c.next.subtitle} />
    </>
  )
}
