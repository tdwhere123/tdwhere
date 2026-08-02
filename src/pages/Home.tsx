import CubeShowcase from '@/components/home/CubeShowcase'
import FieldSection from '@/components/home/FieldSection'
import AboutTeaser from '@/components/home/AboutTeaser'
import HomeCoda from '@/components/home/HomeCoda'

export default function Home() {
  return (
    <div className="cube-home-theme -mt-16">
      <CubeShowcase />
      <FieldSection />
      <AboutTeaser />
      <HomeCoda />
    </div>
  )
}
