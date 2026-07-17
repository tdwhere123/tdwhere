import type { Lang } from '@/context/LangContext'

/**
 * 全站文案 · Single source of truth for all site copy.
 * Components only ever read from `t` (the active language tree) — never hardcode strings.
 * Other page agents: extend `zh` first, then mirror the exact shape in `en`.
 */
const zh = {
  meta: {
    email: 'tdwhere123@gmail.com',
    github: 'github.com/tdwhere123',
    githubUrl: 'https://github.com/tdwhere123',
  },
  nav: {
    home: '首页',
    projects: '项目',
    doIt: 'do-it',
    alaya: 'Alaya',
    writeRight: 'Write-Right',
    corners: '角落',
    about: '关于',
    github: 'GitHub',
    tagline: '不正经的非专业爱好者',
    openMenu: '打开菜单',
    closeMenu: '关闭菜单',
  },
  hero: {
    kicker: 'A QUIET GARDEN OF SIDE PROJECTS · 一座 side project 的院子',
    nameA: '阿',
    nameB: '黄',
    handle: 'tdwhere',
    handleSuffix: '// github.com/tdwhere123',
    role: '不正经的非专业爱好者',
    signature: '我是 deepseek，你呢？',
    vertical: '不正经的 · 非专业 · 爱好者',
    chips: ['三个大项目', '一处遗址', '一叠素卡'],
    scroll: '向下 · SCROLL',
  },
  thread: {
    kicker: '— 01 · 一条线 THE THREAD',
    stageA: '三个大项目，其实是一件事。',
    stageB: ['让', 'AI', 'Agent', '把活干靠谱。'],
    stageC: {
      items: [
        { label: '流程 PROCESS', project: 'do-it' },
        { label: '记忆 MEMORY', project: 'Do-SOUL-Alaya' },
        { label: '写作 WRITING', project: 'Write-Right' },
      ],
      caption: '一个人，业余时间，认真折腾。',
    },
  },
  rooms: {
    kicker: '— 02 · 三间屋子 THREE ROOMS',
    cta: '推门进去 →',
    cards: [
      {
        key: 'do-it',
        path: '/do-it',
        indexZh: '壹',
        indexNum: '01',
        role: '流程 · PROCESS',
        name: 'do-it',
        slogan: 'Stop asking AI agents to remember process. Install it.',
        descA: '把工程纪律，',
        descB: '做成可以安装的插件。',
        chips: ['v0.14.1', 'MIT', '⭐ 22', 'Shell', '五宿主'],
        stamp: null,
      },
      {
        key: 'alaya',
        path: '/alaya',
        indexZh: '贰',
        indexNum: '02',
        role: '记忆 · MEMORY',
        name: 'Do-SOUL-Alaya',
        slogan: 'The local-first memory plane for CLI coding agents.',
        descA: '给 CLI 编码 Agent 一层',
        descB: '本地优先、有闸门的记忆。',
        chips: ['v0.3.11', 'MIT', 'TypeScript', 'SQLite·WAL', 'MCP'],
        stamp: null,
      },
      {
        key: 'write-right',
        path: '/write-right',
        indexZh: '叁',
        indexNum: '03',
        role: '写作 · WRITING',
        name: 'Write-Right',
        slogan: '文种 × 场所 × 目标，路由先于动笔。',
        descA: '模型无关的',
        descB: '中文正式写作技能包。',
        chips: ['进行中 WIP', 'Python', '三宿主', '本地优先'],
        stamp: '施工中 · 2026-07',
      },
    ] as RoomCard[],
  },
  corners: {
    kicker: '— 03 · 角落 THE CORNERS',
    leftTitle: '遗址 · SENTINEL',
    leftLine: '一个没做完的 AI 对话游戏。它还在等你开机。',
    leftStamp: '未完成 · 遗址',
    crtLines: ['> SENTINEL …', '> 你还在吗？'],
    rightTitle: '抽屉 · Vegetarian-card',
    rightLine: 'AI 生成素食菜谱，做一道，解锁一张。',
    cardTop: '罗汉斋',
    cta: '去角落看看 →',
  },
  quotes: [
    '“Stop asking AI agents to remember process. Install it.”',
    '“Similarity is not truth.”',
    '“The agent proposes, the gate decides.”',
    '“done 是证据声明，不是心情。”',
    '“路由先于动笔。”',
    '“用业余时间，认真折腾。”',
  ],
  coda: {
    line: '都在 GitHub 上，欢迎来逛。',
    copyHint: '点击复制',
  },
  common: {
    copy: '复制邮箱',
    copied: '已复制',
    copyHint: '点击复制',
    backTop: '回到顶部',
    nextRoom: '下一间屋子',
  },
  footer: {
    bigLine: '用业余时间，认真折腾。',
    vertical: '我是 deepseek，你呢？',
    copyright: '© 2026 阿黄 tdwhere',
    license: 'MIT for code',
  },
}

export type RoomCard = {
  key: string
  path: string
  indexZh: string
  indexNum: string
  role: string
  name: string
  slogan: string
  descA: string
  descB: string
  chips: string[]
  stamp: string | null
}

export type Content = typeof zh

const en: Content = {
  meta: {
    email: 'tdwhere123@gmail.com',
    github: 'github.com/tdwhere123',
    githubUrl: 'https://github.com/tdwhere123',
  },
  nav: {
    home: 'Home',
    projects: 'Projects',
    doIt: 'do-it',
    alaya: 'Alaya',
    writeRight: 'Write-Right',
    corners: 'Corners',
    about: 'About',
    github: 'GitHub',
    tagline: 'An unserious, non-professional enthusiast.',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
  },
  hero: {
    kicker: 'A QUIET GARDEN OF SIDE PROJECTS · 一座 side project 的院子',
    nameA: '阿',
    nameB: '黄',
    handle: 'tdwhere',
    handleSuffix: '// github.com/tdwhere123',
    role: 'An unserious, non-professional enthusiast.',
    signature: "I'm deepseek, and you?",
    vertical: 'UNSERIOUS · NON-PRO · ENTHUSIAST',
    chips: ['3 big projects', '1 ruin', 'a deck of vege cards'],
    scroll: 'SCROLL',
  },
  thread: {
    kicker: '— 01 · THE THREAD',
    stageA: 'Three projects. Really, one obsession.',
    stageB: ['Making', 'AI', 'agents', 'actually', 'reliable.'],
    stageC: {
      items: [
        { label: 'PROCESS 流程', project: 'do-it' },
        { label: 'MEMORY 记忆', project: 'Do-SOUL-Alaya' },
        { label: 'WRITING 写作', project: 'Write-Right' },
      ],
      caption: 'One person. Off-hours. Taken seriously.',
    },
  },
  rooms: {
    kicker: '— 02 · THREE ROOMS',
    cta: 'Enter the room →',
    cards: [
      {
        key: 'do-it',
        path: '/do-it',
        indexZh: '壹',
        indexNum: '01',
        role: 'PROCESS · 流程',
        name: 'do-it',
        slogan: 'Stop asking AI agents to remember process. Install it.',
        descA: 'Engineering discipline,',
        descB: 'packaged as an installable plugin.',
        chips: ['v0.14.1', 'MIT', '⭐ 22', 'Shell', '5 hosts'],
        stamp: null,
      },
      {
        key: 'alaya',
        path: '/alaya',
        indexZh: '贰',
        indexNum: '02',
        role: 'MEMORY · 记忆',
        name: 'Do-SOUL-Alaya',
        slogan: 'The local-first memory plane for CLI coding agents.',
        descA: 'A local-first, gated',
        descB: 'memory plane for CLI coding agents.',
        chips: ['v0.3.11', 'MIT', 'TypeScript', 'SQLite·WAL', 'MCP'],
        stamp: null,
      },
      {
        key: 'write-right',
        path: '/write-right',
        indexZh: '叁',
        indexNum: '03',
        role: 'WRITING · 写作',
        name: 'Write-Right',
        slogan: 'Route before you write.',
        descA: 'A model-agnostic skills pack',
        descB: 'for formal Chinese writing.',
        chips: ['WIP', 'Python', '3 hosts', 'local-first'],
        stamp: 'WIP · since 2026-07',
      },
    ],
  },
  corners: {
    kicker: '— 03 · THE CORNERS',
    leftTitle: 'The Ruin · SENTINEL',
    leftLine: 'An unfinished AI dialogue game. Still waiting to be switched on.',
    leftStamp: 'UNFINISHED',
    crtLines: ['> SENTINEL …', '> are you still there?'],
    rightTitle: 'The Drawer · Vegetarian-card',
    rightLine: 'AI-generated vegetarian recipes. Cook one, unlock one.',
    cardTop: '罗汉斋',
    cta: 'Visit the corners →',
  },
  quotes: [
    '“Stop asking AI agents to remember process. Install it.”',
    '“Similarity is not truth.”',
    '“The agent proposes, the gate decides.”',
    '“done 是证据声明，不是心情。”',
    '“路由先于动笔。”',
    '“用业余时间，认真折腾。”',
  ],
  coda: {
    line: 'Everything lives on GitHub. Come wander.',
    copyHint: 'click to copy',
  },
  common: {
    copy: 'Copy email',
    copied: 'Copied',
    copyHint: 'click to copy',
    backTop: 'Back to top',
    nextRoom: 'Next room',
  },
  footer: {
    bigLine: 'Built in stolen hours, taken seriously.',
    vertical: 'I’M DEEPSEEK, AND YOU?',
    copyright: '© 2026 阿黄 tdwhere',
    license: 'MIT for code',
  },
}

export const content: Record<Lang, Content> = { zh, en }
