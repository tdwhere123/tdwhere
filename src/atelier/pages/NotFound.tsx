import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { useWords } from '../hooks'
import { Art, Caption } from '../components/Primitives'
export default function NotFound() {
  const w = useWords()
  return (
    <section className="a-not-found">
      <Art name="landscape" eager intensity="quiet" />
      <Caption>404 / A PATH NOT YET DRAWN</Caption>
      <h1>
        4<em>0</em>4
      </h1>
      <p>{w('这条路，还没有画出来。', 'This path has not been drawn yet.')}</p>
      <Link to="/" className="a-link">
        {w('回到首页', 'Back to home')}
        <ArrowUpRight size={16} />
      </Link>
    </section>
  )
}
