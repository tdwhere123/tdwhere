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
        <Caption>EARLIER EXPERIMENTS / OPEN ENDS</Caption>
        <h1>
          Else<em>where.</em>
        </h1>
        <p>
          {w('不是每条路都走到了终点。', 'Not every path reached its end.')}
          <br />
          {w('有些问题，正是从这里开始。', 'Some questions began right here.')}
        </p>
        <span className="a-handwritten" aria-hidden="true">
          unfinished, not forgotten.
        </span>
      </header>
      <section id="veggie" className="a-experiment is-veggie">
        <div className="a-experiment-copy">
          <Caption number="01">VEGETARIAN-CARD</Caption>
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
