/**
 * 文章索引 · Blog post registry.
 * Meta lives here; bodies are body-only markdown files in ./posts/<slug>.md
 * (loaded via Vite ?raw glob). Array order = list order (date desc).
 */
export type PostMeta = {
  slug: string
  title: string
  /** YYYY-MM-DD */
  date: string
  tags: string[]
  summary: string
  /** Linux.do 原文链接 */
  source: string
}

export const posts: PostMeta[] = [
  {
    slug: 'memory-is-not-one-thing',
    title: '关于AI Memory，我们如何理解？（三）',
    date: '2026-08-07',
    tags: ['AI', 'Agent Memory', '记忆形态'],
    summary:
      '从 Hopfield 到 Transformer，再到 Soft Token 与 Test-Time Learning——模型侧记忆不是单线升级，而是不断重新分配「过去」的存在形式。外部记忆保存可证明的过去，内部记忆承载过去留下的影响。',
    source: 'https://linux.do/t/topic/2720175',
  },
  {
    slug: 'know-what-we-want',
    title: '我是如何学习AI的？（二）',
    date: '2026-07-10',
    tags: ['AI', '学习', '方法'],
    summary:
      '一次线下 AI 茶话会的筹备复盘：模糊愿望 → 反问澄清 → 改写问题 → 划定边界 → 形成可行动目标；以及「规划—执行—审查—修正—交付」的执行循环。',
    source: 'https://linux.do/t/topic/2561051',
  },
  {
    slug: 'learn-ai-by-building',
    title: '我是如何学习AI的？（一）',
    date: '2026-06-08',
    tags: ['AI', '学习', '项目'],
    summary:
      '怎么学习 AI？从做项目开始：把目标拆成阶段，先调研再发问，让 AI 帮你选工具，然后重复「发现问题—思考—找工具—解决」的循环。',
    source: 'https://linux.do/t/topic/2337161',
  },
  {
    slug: 'no-new-needs',
    title: 'AI时代，什么是新需求？（二）',
    date: '2026-05-30',
    tags: ['AI', '需求', '思考'],
    summary:
      '生产力不等于需求，需求也不是被创造出来的。AI 介入的真正分水岭，是效率提升还是改变了人与事之间的关系——前者在消灭事情，后者属于创造。',
    source: 'https://linux.do/t/topic/2273419',
  },
  {
    slug: 'memory-retrieval-and-write',
    title: 'Agent Memory的反思（二）',
    date: '2026-05-19',
    tags: ['AI', 'Agent Memory', '检索'],
    summary:
      '召回手段可以穷举：稀疏检索、稠密向量、Agentic 检索与图结构。但记忆系统好用的上限，往往由写入时的记忆形式决定；附 2021–2026 Agent Memory 研究时间线。',
    source: 'https://linux.do/t/topic/2207029',
  },
  {
    slug: 'agent-memory-governance',
    title: '关于Agent Memory的反思（一）',
    date: '2026-05-11',
    tags: ['AI', 'Agent Memory', '治理'],
    summary:
      '记忆不止是「记得多少」，更是「过去如何影响现在」。本文讨论 Agent 记忆的治理问题：什么该记住、什么该遗忘、写入阶段如何前置治理，以及「舒适的共谋」的风险。',
    source: 'https://linux.do/t/topic/2156133',
  },
]

const bodies = import.meta.glob('./posts/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

export function getPost(slug: string): PostMeta | undefined {
  return posts.find((p) => p.slug === slug)
}

export function getPostBody(slug: string): string | undefined {
  return bodies[`./posts/${slug}.md`]
}
