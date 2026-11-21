import { lazy, Suspense } from 'react'
import { useWords } from '../hooks'
import { Art, Caption, NextProject } from '../components/Primitives'

const VegetarianCards = lazy(
  () => import('@/components/playground/VegetarianCards'),
)

export default function Playground() {
  const w = useWords()
  return (
    <div className="a-playground">
      <header className="a-elsewhere-hero">
        <Art name="construction" eager intensity="quiet" />
        <h1 data-rise>{w('其他尝试', 'Other experiments')}</h1>
        <p data-fade="0.2">{w('一些没有继续做下去的尝试。', 'A few things I tried and did not carry further.')}</p>
      </header>
      <section id="veggie" className="a-experiment is-veggie">
        <div className="a-experiment-copy">
          <Caption>Vegetarian-card</Caption>
          <h2>{w('从一张素食卡片开始。', 'It began with a recipe card.')}</h2>
          <p>
            {w(
              '一次围绕素食菜谱卡的早期产品尝试。保留它，不是为了凑作品数量，而是记住自己从哪里开始。',
              'An early product experiment around vegetarian recipe cards. Kept not to fill a portfolio, but to remember where the work began.',
            )}
          </p>
        </div>
        <div className="a-experiment-stage">
          <Suspense
            fallback={
              <p className="a-micro">
                {w('正在摆出卡片……', 'Laying out the cards…')}
              </p>
            }
          >
            <VegetarianCards bare />
          </Suspense>
        </div>
      </section>
      <NextProject
        name={w('关于', 'About')}
        to="/about"
        note={w(
          '这些尝试背后，是同一个人和一些没变的问题。',
          'Behind these experiments: the same person, and questions that have not changed.',
        )}
      />
    </div>
  )
}
