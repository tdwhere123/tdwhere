import { lazy, Suspense, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Power } from 'lucide-react'
import { useWords } from '../hooks'
import { Art, Caption } from '../components/Primitives'
const OriginalPlayground = lazy(() => import('@/pages/Playground'))
export default function Playground() {
  const w = useWords(),
    [open, setOpen] = useState(false)
  return (
    <div className="a-playground">
      <header className="a-elsewhere-hero">
        <Art name="construction" eager />
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
      <section className="a-experiments">
        <article>
          <Caption number="01">SENTINEL</Caption>
          <div className="a-terminal-silhouette" aria-hidden="true">
            <div>
              <span>_</span>
              <small>THE SIGNAL REMAINS.</small>
            </div>
          </div>
          <h2>{w('一段尚未结束的对话。', 'An unfinished conversation.')}</h2>
          <p>
            {w(
              '早期 AI 对话与叙事游戏实验。原有终端、线索与卡片交互保留在下面，作为一段完整的历史尝试，而不是改写成新的产品承诺。',
              'An early experiment in AI dialogue and narrative. The original terminal, clues and card interactions are preserved below as an earlier work, not recast as a new product promise.',
            )}
          </p>
          <button
            className="a-button"
            data-testid="open-terminal"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            <Power size={15} />
            {w(
              open ? '收起原始实验' : '打开原始实验',
              open
                ? 'Close the original experiment'
                : 'Open the original experiment',
            )}
          </button>
        </article>
        <article>
          <Caption number="02">VEGETARIAN-CARD</Caption>
          <div className="a-recipe-cards" aria-hidden="true">
            <i />
            <i />
            <i />
            <span>
              first things
              <br />
              <em>first.</em>
            </span>
          </div>
          <h2>{w('从一张素食卡片开始。', 'It began with a recipe card.')}</h2>
          <p>
            {w(
              '一次围绕素食菜谱卡的早期产品尝试。保留它，不是为了填满作品数量，而是记住自己从哪里开始。',
              'An early product experiment around vegetarian recipe cards. Kept not to fill a portfolio, but to remember where the work began.',
            )}
          </p>
          <Link to="/about" className="a-link">
            {w('关于这些尝试', 'About these experiments')}
            <ArrowUpRight size={16} />
          </Link>
        </article>
      </section>
      {open && (
        <section
          className="a-original-experiment"
          aria-label={w('保留的原始实验', 'The preserved original experiment')}
        >
          <Caption>
            {w(
              '原始交互 / 保留版本',
              'ORIGINAL INTERACTIONS / PRESERVED VERSION',
            )}
          </Caption>
          <Suspense
            fallback={
              <p>
                {w('正在展开原始实验……', 'Opening the original experiment…')}
              </p>
            }
          >
            <OriginalPlayground />
          </Suspense>
        </section>
      )}
    </div>
  )
}
