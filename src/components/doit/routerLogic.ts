/**
 * do-it router simulator — front-end judgment rules (design: do-it.md §3.3).
 * Pure functions, no React — easy to unit-check.
 */

export type RiskLevel = 'LIGHT' | 'STANDARD' | 'HEAVY'

export interface RouteResult {
  level: RiskLevel
  /** matched keywords that drove the verdict (winning tier first) */
  signals: string[]
  buckets: string[]
  agents: string[]
  /** no keyword hit at all → defaulted to STANDARD */
  unclear: boolean
}

const HEAVY_WORDS = [
  '重构', '迁移', '架构', '数据库', 'schema', '鉴权', 'auth', '安全', '支付',
  'payment', '上线', '全量', '删除', 'refactor', 'migrate', 'architecture',
]
const STANDARD_WORDS = [
  '新增', '功能', 'feature', 'api', '接口', '分页', '测试', 'test', '修复',
  'fix', 'bug', '集成', '验证码', 'captcha',
]
const LIGHT_WORDS = [
  '错别字', 'typo', '文案', '注释', 'comment', '重命名', 'rename', '格式化',
  'format', 'readme', '样式',
]

const CODE_WORDS = [
  '代码', '测试', 'test', 'api', '接口', 'code', '修复', 'fix', 'bug', '分页',
  '集成', '验证码', 'captcha', '新增', '功能', 'feature', '单元测试',
]
const DECIDE_WORDS = ['选择', '方案', '权衡', 'trade-off', 'tradeoff', '迁移', 'migrate']
const REVIEW_WORDS = ['review', '评审', '检查']
const VERIFY_WORDS = ['上线', '验证', 'verify', '完成', 'done']

/** the ten optional specialists, in fan order (design §3.2 act 2) */
export const ALL_AGENTS = [
  'product-strategist',
  'architecture-strategist',
  'plan-challenger',
  'code-mapper',
  'code-quality-cleaner',
  'tdd-red-writer',
  'reviewer',
  'red-team-reviewer',
  'spec-compliance-reviewer',
  'documentation-engineer',
] as const

const AGENTS_BY_LEVEL: Record<RiskLevel, string[]> = {
  HEAVY: [
    'architecture-strategist',
    'plan-challenger',
    'reviewer',
    'red-team-reviewer',
    'spec-compliance-reviewer',
  ],
  STANDARD: ['code-mapper', 'tdd-red-writer', 'reviewer'],
  LIGHT: ['code-quality-cleaner'],
}

function hits(text: string, words: string[]): string[] {
  const seen = new Set<string>()
  for (const w of words) {
    const needle = w.toLowerCase()
    if (text.includes(needle) && !seen.has(needle)) {
      seen.add(needle)
    }
  }
  return [...seen]
}

export function classifyTask(input: string): RouteResult {
  const text = input.toLowerCase()

  const heavyHits = hits(text, HEAVY_WORDS)
  const standardHits = hits(text, STANDARD_WORDS)
  const lightHits = hits(text, LIGHT_WORDS)

  let level: RiskLevel
  let signals: string[]
  if (heavyHits.length > 0) {
    level = 'HEAVY'
    signals = heavyHits
  } else if (standardHits.length > 0) {
    /* a typo-class task stays LIGHT even when phrased as "fix a typo" —
     * generic fix-words alone don't escalate a light task */
    const genericFixOnly = standardHits.every((s) => ['fix', '修复', 'bug'].includes(s))
    if (lightHits.length > 0 && genericFixOnly) {
      level = 'LIGHT'
      signals = lightHits
    } else {
      level = 'STANDARD'
      signals = standardHits
    }
  } else if (lightHits.length > 0) {
    level = 'LIGHT'
    signals = lightHits
  } else {
    level = 'STANDARD'
    signals = []
  }
  const unclear = heavyHits.length + standardHits.length + lightHits.length === 0

  const buckets = new Set<string>(['do-it-router'])
  if (hits(text, CODE_WORDS).length > 0) buckets.add('do-it-code-quality')
  if (hits(text, DECIDE_WORDS).length > 0) buckets.add('do-it-decide')
  if (hits(text, REVIEW_WORDS).length > 0) buckets.add('do-it-review')
  if (hits(text, VERIFY_WORDS).length > 0) buckets.add('do-it-verify')
  if (level === 'HEAVY') {
    buckets.add('do-it-decide')
    buckets.add('do-it-verify')
  }

  return {
    level,
    signals: signals.slice(0, 4),
    buckets: [...buckets],
    agents: AGENTS_BY_LEVEL[level],
    unclear,
  }
}
