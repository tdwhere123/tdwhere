import { useWords } from '../hooks'
import {
  Art,
  Caption,
  LinkLine,
  Reveal,
  NextProject,
} from '../components/Primitives'
import ProcessScene from '../components/ProcessScene'
export default function DoIt() {
  const w = useWords()
  return (
    <div className="a-doit a-project-page">
      <header className="a-construct-hero">
        <Art name="construction" eager />
        <Caption number="02">AGENT WORKFLOW / REUSABLE SKILLS</Caption>
        <h1>
          do-it
          <span>
            {w('把意图，', 'From intention,')}
            <br />
            <em>{w('带到结果。', 'to a result.')}</em>
          </span>
        </h1>
        <p>
          {w(
            '把任务判断、实施、审查与验证，组织成可以复用的编码工作方式。不是让 Agent 背诵流程，而是让工作有边界、有依据。',
            'Reusable coding workflows for task assessment, implementation, review and verification. Not a process to recite, but boundaries and evidence to work with.',
          )}
        </p>
        <div className="a-hero-links">
          <LinkLine to="/do-it#workflow">
            {w('跟随一件任务', 'Follow a task')}
          </LinkLine>
          <LinkLine external to="https://github.com/tdwhere123/do-it">
            GitHub
          </LinkLine>
        </div>
        <span className="a-construction-mark" aria-hidden="true">
          measure twice.
          <br />
          build once.
        </span>
      </header>
      <section className="a-workflow-chapter" id="workflow">
        <div className="a-chapter-heading">
          <Caption>THE WORKING STUDY</Caption>
          <Reveal>
            <h2>
              {w('“完成”不是一句话。', '“Done” is not a sentence.')}
              <br />
              <em>{w('是一个可检查的结果。', 'It is a checkable result.')}</em>
            </h2>
          </Reveal>
          <p>
            {w(
              '换一件任务，路径也会不同。把它推进到验证阶段：样例会先失败，补齐条件、重新检查后，才能交付。',
              'Choose a task and watch the route change. Advance to verification: the example fails first, then requires a repair and another check before delivery.',
            )}
          </p>
        </div>
        <ProcessScene />
      </section>
      <section className="a-making-notes">
        <div className="a-large-aside">
          less ritual.
          <br />
          <em>more evidence.</em>
        </div>
        <div>
          <article>
            <Caption number="01">
              {w('因任务而变', 'Adapt to the work')}
            </Caption>
            <h3>
              {w('小修改，不需要大仪式。', 'Small changes need less ceremony.')}
            </h3>
            <p>
              {w(
                '风险、影响面与不确定性决定投入多少判断和复核。路由是建议，不应把所有任务压成同一条流水线。',
                'Risk, impact and uncertainty determine how much judgment and review are useful. Routing is advisory, not a universal conveyor belt.',
              )}
            </p>
          </article>
          <article>
            <Caption number="02">
              {w('把声明落到证据', 'Ground the claim')}
            </Caption>
            <h3>
              {w(
                '测试过什么，比“测试通过”更重要。',
                'What was tested matters.',
              )}
            </h3>
            <p>
              {w(
                '让检查范围、失败条件与结果一起留下。交付的是改动和依据，不是一枚绿色徽章。',
                'Keep the scope of the check, its failure conditions and the result. Deliver the change and its basis, not just a green badge.',
              )}
            </p>
          </article>
        </div>
      </section>
      <NextProject
        name="Write-Right"
        to="/write-right"
        note={w(
          '把同样的过程意识，带进写作。',
          'Bring the same care to writing.',
        )}
      />
    </div>
  )
}
