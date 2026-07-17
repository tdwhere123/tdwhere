export type CubeFacePosition = 'front' | 'right' | 'back' | 'left' | 'top' | 'bottom'

export type CubeStageId =
  | 'home'
  | 'alaya'
  | 'do-it'
  | 'write-right'
  | 'sentinel'
  | 'vegetarian'

export type CubeProject = {
  id: CubeStageId
  index: string
  categoryZh: string
  categoryEn: string
  title: string
  statementZh: string
  statementEn: string
  descriptionZh: string
  descriptionEn: string
  tags: string[]
  image: string
  alt: string
  route?: string
  github?: string
  ctaZh: string
  ctaEn: string
  face: CubeFacePosition
  shortName: string
}

export const cubeProjects: CubeProject[] = [
  {
    id: 'home',
    index: '00',
    categoryZh: 'PERSONAL LAB',
    categoryEn: 'PERSONAL LAB',
    title: '阿黄 · tdwhere',
    statementZh: '用业余时间，认真折腾。',
    statementEn: 'Side projects, taken seriously.',
    descriptionZh: '我关心的不是让 AI 看起来更聪明，而是让 Agent 真正记得、判断并完成工作。',
    descriptionEn:
      'Not smarter-looking AI — agents that remember, decide, and finish the work.',
    tags: [],
    image: '/cube/home.png',
    alt: 'Museum alcove with a floating stone cube',
    ctaZh: 'SCROLL TO ROTATE',
    ctaEn: 'SCROLL TO ROTATE',
    face: 'front',
    shortName: 'Home',
  },
  {
    id: 'alaya',
    index: '01',
    categoryZh: 'MEMORY',
    categoryEn: 'MEMORY',
    title: 'Do-SOUL-Alaya',
    statementZh: 'Similarity is not truth.',
    statementEn: 'Similarity is not truth.',
    descriptionZh: '给 CLI 编码 Agent 一层本地优先、可治理、可审计、可回溯的记忆平面。',
    descriptionEn:
      'A local-first, governable, auditable memory plane for CLI coding agents.',
    tags: ['TYPESCRIPT', 'SQLITE', 'MCP', 'LOCAL-FIRST'],
    image: '/cube/alaya.png',
    alt: 'Concentric stone rings around a square portal',
    route: '/alaya',
    github: 'https://github.com/tdwhere123',
    ctaZh: 'VIEW PROJECT',
    ctaEn: 'VIEW PROJECT',
    face: 'right',
    shortName: 'Alaya',
  },
  {
    id: 'do-it',
    index: '02',
    categoryZh: 'PROCESS',
    categoryEn: 'PROCESS',
    title: 'do-it',
    statementZh: 'Stop asking AI agents to remember process. Install it.',
    statementEn: 'Stop asking AI agents to remember process. Install it.',
    descriptionZh: '把路由、判断、审查和验证，做成可以安装到不同编码 Agent 中的工作方式。',
    descriptionEn:
      'Routing, judgment, review, and verification — installed into coding agents.',
    tags: ['CODEX', 'CLAUDE CODE', 'CURSOR', 'OPENCODE'],
    image: '/cube/do-it.png',
    alt: 'Mechanical stone device with a circular track',
    route: '/do-it',
    github: 'https://github.com/tdwhere123/do-it',
    ctaZh: 'VIEW PROJECT',
    ctaEn: 'VIEW PROJECT',
    face: 'back',
    shortName: 'do-it',
  },
  {
    id: 'write-right',
    index: '03',
    categoryZh: 'WRITING',
    categoryEn: 'WRITING',
    title: 'Write-Right',
    statementZh: '文种 × 场所 × 目标，路由先于动笔。',
    statementEn: 'Genre × place × goal — route before writing.',
    descriptionZh: '模型无关的中文正式写作技能包，包含本地素材、偏好学习、召回与审校流程。',
    descriptionEn:
      'Model-agnostic Chinese formal writing skills with local corpus, recall, and review.',
    tags: ['PYTHON', 'LOCAL-FIRST', 'AGENT SKILLS'],
    image: '/cube/write-right.png',
    alt: 'Stone sculpture of a writer at a desk',
    route: '/write-right',
    github: 'https://github.com/tdwhere123/write-right',
    ctaZh: 'VIEW PROJECT',
    ctaEn: 'VIEW PROJECT',
    face: 'left',
    shortName: 'Write-Right',
  },
  {
    id: 'sentinel',
    index: '04',
    categoryZh: 'RUIN',
    categoryEn: 'RUIN',
    title: 'Gibberish-SENTINEL',
    statementZh: '它还在等你重新开机。',
    statementEn: 'Still waiting for you to power it back on.',
    descriptionZh: '一个以 AI 对话、邮件、数据碎片和调查任务驱动的静态叙事游戏。',
    descriptionEn:
      'A static narrative game driven by AI dialogue, mail, data shards, and inquiry.',
    tags: ['JAVASCRIPT', 'AI DIALOGUE', 'NARRATIVE GAME'],
    image: '/cube/sentinel.png',
    alt: 'Aged CRT terminal in a stone alcove',
    route: '/playground',
    github: 'https://github.com/tdwhere123',
    ctaZh: 'OPEN THE TERMINAL',
    ctaEn: 'OPEN THE TERMINAL',
    face: 'top',
    shortName: 'SENTINEL',
  },
  {
    id: 'vegetarian',
    index: '05',
    categoryZh: 'FIRST PROJECT',
    categoryEn: 'FIRST PROJECT',
    title: 'Vegetarian-card',
    statementZh: '做一道，解锁一张。',
    statementEn: 'Cook one dish, unlock one card.',
    descriptionZh: '我的第一个 vibe coding 项目：一个以素食菜谱卡为核心的微信小程序尝试。',
    descriptionEn:
      'My first vibe-coding project: a WeChat mini-program centered on vegetarian recipe cards.',
    tags: ['MINI PROGRAM', 'RECIPE CARDS', 'ARCHIVED'],
    image: '/cube/vegetarian.png',
    alt: 'Stone recipe-card altar with herbs and vegetables',
    github: 'https://github.com/tdwhere123',
    ctaZh: 'VIEW ON GITHUB',
    ctaEn: 'VIEW ON GITHUB',
    face: 'bottom',
    shortName: 'Vegetarian',
  },
]

export const cubeRotations: Record<
  CubeStageId,
  { rotateX: number; rotateY: number }
> = {
  home: { rotateX: -6, rotateY: 10 },
  alaya: { rotateX: 0, rotateY: -90 },
  'do-it': { rotateX: 0, rotateY: -180 },
  'write-right': { rotateX: 0, rotateY: -270 },
  sentinel: { rotateX: -90, rotateY: -360 },
  vegetarian: { rotateX: -270, rotateY: -360 },
}

export const CUBE_SHELL = '/cube/shell.png'
