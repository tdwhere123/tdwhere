import CubeShowcase from '@/components/home/CubeShowcase'
import HeroOverlay from '@/components/home/HeroOverlay'
import WorksWall from '@/components/home/WorksWall'
import AboutTeaser from '@/components/home/AboutTeaser'
import HomeCoda from '@/components/home/HomeCoda'

export default function Home() {
  return (
    <div className="cube-home-theme -mt-16">
      <div className="relative">
        <CubeShowcase />
        <HeroOverlay />
      </div>
      <WorksWall />
      <AboutTeaser />
      <HomeCoda />
    </div>
  )
}
