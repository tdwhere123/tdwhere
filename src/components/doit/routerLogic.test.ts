import { describe, expect, it } from 'vitest'
import { classifyTask, type RiskLevel } from './routerLogic'

type Case = {
  name: string
  input: string
  level: RiskLevel
  unclear?: boolean
  /** every listed bucket must appear */
  bucketsInclude?: string[]
  /** none of these buckets should appear (except always-present router) */
  bucketsExclude?: string[]
}

const cases: Case[] = [
  {
    name: 'HEAVY wins over STANDARD when architecture keywords present',
    input: '重构支付鉴权与数据库 schema',
    level: 'HEAVY',
    bucketsInclude: ['do-it-router', 'do-it-decide', 'do-it-verify'],
  },
  {
    name: 'HEAVY from English refactor / migrate',
    input: 'refactor auth and migrate architecture',
    level: 'HEAVY',
    bucketsInclude: ['do-it-decide', 'do-it-verify'],
  },
  {
    name: 'STANDARD feature / api work',
    input: '新增分页 API 接口',
    level: 'STANDARD',
    bucketsInclude: ['do-it-router', 'do-it-code-quality'],
  },
  {
    name: 'STANDARD English feature + test',
    input: 'add a new feature with unit test coverage',
    level: 'STANDARD',
    bucketsInclude: ['do-it-code-quality'],
  },
  {
    name: 'LIGHT typo / 错别字 alone',
    input: '修几个错别字和注释',
    level: 'LIGHT',
  },
  {
    name: 'LIGHT English typo / rename / format',
    input: 'fix typo in readme and rename a comment',
    level: 'LIGHT',
  },
  {
    name: '"fix a typo" stays LIGHT (generic fix does not escalate)',
    input: 'fix a typo',
    level: 'LIGHT',
  },
  {
    name: 'Chinese 修复 typo-class stays LIGHT',
    input: '修复错别字',
    level: 'LIGHT',
  },
  {
    name: 'real fix/bug without light words → STANDARD',
    input: 'fix pagination bug in the API',
    level: 'STANDARD',
    bucketsInclude: ['do-it-code-quality'],
  },
  {
    name: 'unclear input defaults to STANDARD',
    input: 'hello world something vague',
    level: 'STANDARD',
    unclear: true,
    bucketsInclude: ['do-it-router'],
    bucketsExclude: ['do-it-code-quality', 'do-it-decide', 'do-it-review', 'do-it-verify'],
  },
  {
    name: 'empty string is unclear STANDARD',
    input: '',
    level: 'STANDARD',
    unclear: true,
  },
  {
    name: 'decide bucket from 权衡 / trade-off',
    input: '选择方案权衡 trade-off for feature flag',
    level: 'STANDARD',
    bucketsInclude: ['do-it-decide', 'do-it-code-quality'],
  },
  {
    name: 'review bucket from 评审',
    input: '请 review 这次 feature 代码评审检查',
    level: 'STANDARD',
    bucketsInclude: ['do-it-review', 'do-it-code-quality'],
  },
  {
    name: 'verify bucket from 验证 / verify',
    input: '完成验证 verify 文案清单',
    level: 'LIGHT',
    bucketsInclude: ['do-it-verify'],
  },
  {
    name: 'HEAVY precedence over LIGHT when both present',
    input: '安全重构鉴权，顺便改个 typo',
    level: 'HEAVY',
  },
]

describe('classifyTask', () => {
  it.each(cases)('$name', ({ input, level, unclear, bucketsInclude, bucketsExclude }) => {
    const result = classifyTask(input)
    expect(result.level).toBe(level)
    if (unclear !== undefined) {
      expect(result.unclear).toBe(unclear)
    }
    expect(result.buckets).toContain('do-it-router')
    for (const b of bucketsInclude ?? []) {
      expect(result.buckets).toContain(b)
    }
    for (const b of bucketsExclude ?? []) {
      expect(result.buckets).not.toContain(b)
    }
    expect(result.agents.length).toBeGreaterThan(0)
  })
})
