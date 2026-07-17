import { useLang } from '@/context/LangContext'
import { writeRightContent } from '@/content/writeRight'
import GateDivider from '@/components/GateDivider'
import NextProject from '@/components/NextProject'
import WriteRightHero from '@/components/writeright/WriteRightHero'
import ScopeSection from '@/components/writeright/ScopeSection'
import GenreRouter from '@/components/writeright/GenreRouter'
import RepoTree from '@/components/writeright/RepoTree'
import DailyPath from '@/components/writeright/DailyPath'
import PrivacySection from '@/components/writeright/PrivacySection'
import BrassRule from '@/components/writeright/BrassRule'

/**
 * /write-right — 写作之屋 · project page.
 * S1 hero · S2 scope · S3 genre router · S4 repo shape · S5 daily path
 * · S6 privacy · S7 next.
 */
export default function WriteRight() {
  const { lang } = useLang()
  const c = writeRightContent[lang]

  return (
    <>
      <WriteRightHero />

      <div aria-hidden="true" className="mx-auto max-w-shell px-5 md:px-10">
        <GateDivider />
      </div>

      <ScopeSection />

      <div aria-hidden="true" className="mx-auto max-w-shell px-5 md:px-10">
        <BrassRule className="mx-auto h-2 w-full max-w-xs opacity-90" />
      </div>

      <GenreRouter />

      <div aria-hidden="true" className="mx-auto max-w-shell px-5 md:px-10">
        <BrassRule className="mx-auto h-2 w-full max-w-xs opacity-90" />
      </div>

      <RepoTree />

      <div aria-hidden="true" className="mx-auto max-w-shell px-5 md:px-10">
        <BrassRule className="mx-auto h-2 w-full max-w-xs opacity-90" />
      </div>

      <DailyPath />

      <div aria-hidden="true" className="mx-auto max-w-shell px-5 md:px-10">
        <BrassRule className="mx-auto h-2 w-full max-w-xs opacity-90" />
      </div>

      <PrivacySection />

      <NextProject to="/playground" title={c.next.title} subtitle={c.next.subtitle} />
    </>
  )
}
