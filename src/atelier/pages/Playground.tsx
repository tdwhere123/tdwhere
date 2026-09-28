import { lazy, Suspense } from 'react'
import { useWords } from '../hooks'
import { Art, Caption, NextProject } from '../components/Primitives'

const PaintedMachine = lazy(() => import('../components/PaintedMachine'))
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
      <section className="a-experiment is-sentinel">
        <div className="a-experiment-copy">
          <Caption number="01">SENTINEL</Caption>
          <h2>{w('一段尚未结束的对话。', 'An unfinished conversation.')}</h2>
          <p>
            {w(
              '早期的 AI 对话与叙事游戏实验：沿着固定时间线调查一台会记住你写法的机器。游戏没有做完，终端保留原样，可以开机试试。',
              'An early experiment in AI dialogue and narrative: investigate a machine that remembers how you write. The game was never finished; the terminal is preserved as it was, and you can switch it on.',
            )}
          </p>
          <small>
            {w(
              '提示：开机后输入 help 查看命令，键盘会跟着你按下。',
              'Tip: once it boots, type help for commands; the keyboard follows your keys.',
            )}
          </small>
        </div>
        <Suspense fallback={<div className="a-machine-wait" aria-hidden="true" />}>
          <PaintedMachine />
        </Suspense>
      </section>
      <section className="a-experiment is-veggie">
        <div className="a-experiment-copy">
          <Caption number="02">VEGETARIAN-CARD</Caption>
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
