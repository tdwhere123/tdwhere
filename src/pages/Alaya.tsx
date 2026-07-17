import { useLang } from '@/context/LangContext'
import { alayaContent } from '@/content/alaya'
import GateDivider from '@/components/GateDivider'
import NextProject from '@/components/NextProject'
import Hero from '@/components/alaya/Hero'
import Itch from '@/components/alaya/Itch'
import Grammar from '@/components/alaya/Grammar'
import Lifecycle from '@/components/alaya/Lifecycle'
import Recall from '@/components/alaya/Recall'
import Gardeners from '@/components/alaya/Gardeners'
import Footnote from '@/components/alaya/Footnote'
import Toolbox from '@/components/alaya/Toolbox'

/**
 * /alaya — Do-SOUL-Alaya 「记忆之屋」.
 * S1 Hero (Gate Open) · S2 The Itch · S3 Grammar 3×4 · S4 Lifecycle + Gate Demo
 * S5 Recall pipeline · S6 Gardeners · S7 Honest footnote · S8 Toolbox · S9 Next.
 */
export default function Alaya() {
  const { lang } = useLang()
  const a = alayaContent[lang]
  return (
    <>
      <Hero />
      <Itch />
      <GateDivider className="mx-auto max-w-shell px-5 md:px-10" />
      <Grammar />
      <Lifecycle />
      <Recall />
      <Gardeners />
      <Footnote />
      <Toolbox />
      <NextProject to="/write-right" title={a.next.title} subtitle={a.next.subtitle} />
    </>
  )
}
