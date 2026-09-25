import { useWords } from '../hooks'
import {
  Art,
  Caption,
  LinkLine,
  Reveal,
  NextProject,
} from '../components/Primitives'
import WritingScene from '../components/WritingScene'
export default function WriteRight() {
  const w = useWords()
  return (
    <div className="a-writeright a-project-page">
      <header className="a-writing-hero">
        <Art name="manuscript" eager />
        <Caption number="03">CHINESE WRITING / AGENT SKILLS</Caption>
        <span className="a-writing-script" aria-hidden="true">
          a thought,
          <br />
          taking shape.
        </span>
        <h1>
          Write-
          <br />
          <em>Right.</em>
        </h1>
        <div className="a-writing-intro">
          <h2>
            {w('先有来处，', 'First, a foundation.')}
            <br />
            {w('再有表达。', 'Then, expression.')}
          </h2>
          <p>
            {w(
              '面向中文正式写作的 Agent Skills：从文种、场所和目标出发，组织本地材料与偏好，再进入成文和审校。',
              'Agent Skills for formal Chinese writing: begin with genre, setting and purpose; organize local material and preferences before drafting and review.',
            )}
          </p>
          <LinkLine to="/write-right#compose">
            {w('在纸上试一试', 'Try a composition')}
          </LinkLine>
        </div>
      </header>
      <section className="a-writing-chapter" id="compose">
        <div className="a-chapter-heading">
          <Caption>THE COMPOSITION STUDY</Caption>
          <Reveal>
            <h2>
              {w('不是换一种语气。', 'Not just another tone.')}
              <br />
              <em>{w('是换一种组织。', 'Another way to compose.')}</em>
            </h2>
          </Reveal>
          <p>
            {w(
              '四条预设材料，三个不同目的。组织提纲，再检查缺口：目的改变的是信息的先后与重点，而不是凭空创造事实。',
              'Four preset fragments, three purposes. Compose an outline, then check its gaps. A new purpose changes order and emphasis—not the underlying facts.',
            )}
          </p>
        </div>
        <WritingScene />
      </section>
      <section className="a-writing-margins">
        <span className="a-marginalia">
          words need
          <br />
          somewhere
          <br />
          to come from.
        </span>
        <div>
          <Caption>
            {w('材料、结构、审校', 'Material, structure, review')}
          </Caption>
          <h2>
            {w('把你知道的，', 'Bring what you know.')}
            <br />
            <em>
              {w('和还不知道的分开。', 'Leave space for what you do not.')}
            </em>
          </h2>
          <p>
            {w(
              '资料和偏好可以帮助表达，但不能替代事实。结构先于成文，缺失信息明确留下，审校再检查要求、来源与表达是否一致。',
              'Material and preferences can guide expression, but cannot replace facts. Structure comes before prose, missing information stays visible, and review checks requirements, sources and expression together.',
            )}
          </p>
          <LinkLine external to="https://github.com/tdwhere123/write-right">
            {w('查看开源项目', 'Explore the source')}
          </LinkLine>
        </div>
      </section>
      <NextProject
        name="Field notes"
        to="/blog"
        note={w(
          '有些思考，还停在纸上。',
          'Some thoughts are still on the page.',
        )}
      />
    </div>
  )
}
