/** Local teaching fixtures, not Alaya's production retrieval or do-it's runtime. */
export type QueryId = 'design' | 'ship' | 'access'
export type Evidence = {
  id: string
  title: [string, string]
  body: [string, string]
  source: [string, string]
  current: boolean
  query: QueryId[]
  coverage: string[]
  weight: number
  x: number
  y: number
}
export const evidence: Evidence[] = [
  {
    id: 'canvas',
    title: ['自由画布', 'An open canvas'],
    body: [
      '页面可以自由构图，但信息仍然需要清楚。',
      'Compose freely, while keeping the information clear.',
    ],
    source: ['本次设计要求', 'The current design request'],
    current: true,
    query: ['design'],
    coverage: ['direction'],
    weight: 4,
    x: 0.3,
    y: 0.35,
  },
  {
    id: 'meaning',
    title: ['让视觉解释项目', 'Meaningful visuals'],
    body: [
      '交互需要解释项目的作用，而不只是装饰。',
      'Interactions should explain the work, not only decorate it.',
    ],
    source: ['本次设计要求', 'The current design request'],
    current: true,
    query: ['design'],
    coverage: ['purpose'],
    weight: 3,
    x: 0.5,
    y: 0.24,
  },
  {
    id: 'sources',
    title: ['留下来源', 'Keep sources'],
    body: [
      '示意演示与产品真实能力必须分开说明。',
      'Distinguish illustrative examples from actual product capabilities.',
    ],
    source: ['页面演示约定', 'The demonstration boundary'],
    current: true,
    query: ['design', 'ship'],
    coverage: ['evidence'],
    weight: 2,
    x: 0.8,
    y: 0.67,
  },
  {
    id: 'base',
    title: ['部署基础路径', 'Deployment base'],
    body: [
      '项目站点需要保留 /tdwhere/ 基础路径。',
      'Keep the /tdwhere/ base path for this project site.',
    ],
    source: ['本站 Vite 配置', 'This site’s Vite configuration'],
    current: true,
    query: ['ship'],
    coverage: ['routing'],
    weight: 4,
    x: 0.73,
    y: 0.36,
  },
  {
    id: 'assets',
    title: ['资源可访问', 'Assets resolve'],
    body: [
      '图片、字体和路由在生产预览中也需要检查。',
      'Check images, fonts and routes in the production preview.',
    ],
    source: ['本站验收条件', 'This site’s acceptance checks'],
    current: true,
    query: ['ship'],
    coverage: ['assets'],
    weight: 3,
    x: 0.61,
    y: 0.52,
  },
  {
    id: 'touch',
    title: ['触控不锁滚动', 'Native touch scroll'],
    body: [
      '手机保留自然纵向滚动。',
      'Keep natural vertical scrolling on touch devices.',
    ],
    source: ['本次交互要求', 'The current interaction request'],
    current: true,
    query: ['access'],
    coverage: ['touch'],
    weight: 4,
    x: 0.4,
    y: 0.66,
  },
  {
    id: 'motion',
    title: ['减少动态', 'Reduced motion'],
    body: [
      '关闭动态后，仍然能查看完整的过程和结果。',
      'The process and result remain available without motion.',
    ],
    source: ['本站可访问性约定', 'This site’s accessibility boundary'],
    current: true,
    query: ['access'],
    coverage: ['motion'],
    weight: 3,
    x: 0.28,
    y: 0.83,
  },
  {
    id: 'type',
    title: ['清晰的文字', 'Legible text'],
    body: [
      '关键信息不能只存在于图像、颜色或动画里。',
      'Essential information must not depend on images, color or motion.',
    ],
    source: ['本站可访问性约定', 'This site’s accessibility boundary'],
    current: true,
    query: ['access'],
    coverage: ['text'],
    weight: 2,
    x: 0.59,
    y: 0.8,
  },
  {
    id: 'cube',
    title: ['旧立方体导航', 'Old cube navigation'],
    body: [
      '这一设计已经被新的自由画布方向替代。',
      'This design was superseded by the open-canvas direction.',
    ],
    source: ['历史设计；不再采用', 'Historical design; no longer active'],
    current: false,
    query: ['design'],
    coverage: ['direction'],
    weight: 8,
    x: 0.17,
    y: 0.23,
  },
]
export const graphEdges: [string, string][] = [
  ['cube', 'canvas'],
  ['canvas', 'meaning'],
  ['meaning', 'sources'],
  ['sources', 'assets'],
  ['base', 'assets'],
  ['canvas', 'touch'],
  ['touch', 'motion'],
  ['motion', 'type'],
  ['type', 'sources'],
  ['meaning', 'assets'],
]
export function recallFixture(query: QueryId, budget = 3) {
  const cap = Number.isFinite(budget) ? Math.max(0, Math.floor(budget)) : 0
  const candidates = evidence.filter((e) => e.query.includes(query)),
    covered = new Set<string>(),
    selected: Evidence[] = []
  const remaining = candidates.filter((e) => e.current)
  while (selected.length < cap && remaining.length) {
    const scored = remaining
      .map((e) => ({
        e,
        gain: e.coverage.filter((c) => !covered.has(c)).length * e.weight,
      }))
      .sort((a, b) => b.gain - a.gain)
    const best = scored[0]
    if (!best || best.gain <= 0) break
    selected.push(best.e)
    best.e.coverage.forEach((c) => covered.add(c))
    remaining.splice(remaining.indexOf(best.e), 1)
  }
  return { candidates, selected, used: selected.length }
}
export type TaskKind = 'copy' | 'api' | 'auth'
export const workflow: Record<TaskKind, string[]> = {
  copy: ['scope', 'edit', 'verify', 'deliver'],
  api: ['scope', 'plan', 'edit', 'review', 'verify', 'deliver'],
  auth: ['scope', 'plan', 'challenge', 'edit', 'review', 'verify', 'deliver'],
}
export type RunState = { index: number; failed: boolean; repaired: boolean }
export const emptyRun = (): RunState => ({
  index: 0,
  failed: false,
  repaired: false,
})
export function advanceRun(
  kind: TaskKind,
  state: RunState,
  event: 'next' | 'repair' | 'reset',
): RunState {
  if (event === 'reset') return emptyRun()
  if (event === 'repair')
    return state.failed ? { ...state, failed: false, repaired: true } : state
  if (state.failed) return state
  if (workflow[kind][state.index] === 'verify' && !state.repaired)
    return { ...state, failed: true }
  return {
    ...state,
    index: Math.min(workflow[kind].length - 1, state.index + 1),
  }
}
export type WritingGoal = 'report' | 'request' | 'invite'
export const writingNotes: [string, string][] = [
  ['已完成两次社区工作坊。', 'Two community workshops are complete.'],
  [
    '参与者希望增加实践环节。',
    'Participants asked for more hands-on practice.',
  ],
  [
    '现有场地不足以支持小组练习。',
    'The current space cannot support group exercises.',
  ],
  [
    '下一次活动计划采用分组讨论。',
    'The next session is planned around group discussion.',
  ],
]
export const writingOrders: Record<WritingGoal, number[]> = {
  report: [0, 1, 2, 3],
  request: [2, 0, 3, 1],
  invite: [3, 2, 0, 1],
}
export function extractHeadings(
  body: string,
): { level: number; title: string; id: string }[] {
  let fence = ''
  const result: { level: number; title: string; id: string }[] = []
  for (const line of body.split('\n')) {
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})/)
    if (marker) {
      if (!fence) fence = marker[1][0]
      else if (marker[1][0] === fence) fence = ''
      continue
    }
    if (fence) continue
    const match = line.match(/^ {0,3}(#{2,3})\s+(.+?)\s*#*\s*$/)
    if (match)
      result.push({
        level: match[1].length,
        title: match[2]
          .replace(/[*_`]/g, '')
          .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1'),
        id: `section-${result.length + 1}`,
      })
  }
  return result
}
