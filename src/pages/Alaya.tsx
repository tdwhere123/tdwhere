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
import IllustrationPlate from '@/components/IllustrationPlate'

/**
 * /alaya — Do-SOUL-Alaya 「记忆之屋」.
 * S1 Hero · S2 The Itch · plate · S3 Grammar · S4 Lifecycle · S5 Recall
 * · S6 Gardeners · S7 Footnote · S8 Toolbox · S9 Next.
 */
export default function Alaya() {
  const { lang } = useLang()
  const a = alayaContent[lang]
  return (
    <>
      <Hero />
      <Itch />

      <IllustrationPlate
        src="illustrations/alaya-memory-garden.png"
        alt={a.plate.alt}
        kicker={a.plate.kicker}
        caption={a.plate.caption}
        variant="bleed"
      />

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
