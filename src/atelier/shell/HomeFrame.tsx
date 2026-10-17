import { Art } from '../components/Primitives'
import { heroFrame } from '../film'

/**
 * The home painting. It lives in the shell, not the home page, so that when a
 * visitor leaves home it can stay over the page that has just arrived and be
 * parted by the palette knife to show it.
 */
export default function HomeFrame({ parting }: { parting: boolean }) {
  return (
    <div className="a-frame" data-parting={parting ? '' : undefined} aria-hidden="true">
      <Art frame={heroFrame} eager channel="home" className="a-frame-art" />
      <div className="a-frame-haze" />
      <div className="a-frame-veil" />
    </div>
  )
}
