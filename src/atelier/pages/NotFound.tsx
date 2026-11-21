import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { useWords } from '../hooks'
import { Art } from '../components/Primitives'
export default function NotFound() {
  const w = useWords()
  return (
    <section className="a-not-found">
      <Art name="landscape" eager intensity="quiet" />
      <h1>404</h1>
      <p>{w('这个页面不存在。', 'This page doesn’t exist.')}</p>
      <Link to="/" className="a-link">
        {w('回到首页', 'Back to home')}
        <ArrowUpRight size={16} />
      </Link>
    </section>
  )
}
