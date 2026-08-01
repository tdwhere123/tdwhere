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
    tagline: '用业余时间，认真做工具。',
    openMenu: '打开菜单',
    closeMenu: '关闭菜单',
  },
  hero: {
    kicker: '一座 side project 的院子',
    nameA: '阿',
    nameB: '黄',
    handle: 'tdwhere',
    signature: '做让 Agent 靠谱干活的工具。',
    ctaWorks: '看作品',
    ctaAbout: '关于我',
  },
  works: {
    label: '作品 · SELECTED WORKS',
    heading: '业余时间，认真做完。',
  },
  aboutTeaser: {
    lineA: '一个人，在业余时间认真做东西。',
    lineB: '流程、记忆、写作，三件事，慢慢做。',
    link: '更多关于我',
  },
  coda: {
    line: '所有项目都在 GitHub 上，欢迎来逛。',
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
    bigLine: '用业余时间，认真做东西。',
    copyright: '© 2026 阿黄 tdwhere',
    license: 'MIT for code',
  },
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
    tagline: 'Serious tools, built after hours.',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
  },
  hero: {
    kicker: 'A QUIET GARDEN OF SIDE PROJECTS',
    nameA: '阿',
    nameB: '黄',
    handle: 'tdwhere',
    signature: 'I build tools that make agents pull their weight.',
    ctaWorks: 'SEE THE WORKS',
    ctaAbout: 'ABOUT ME',
  },
  works: {
    label: 'SELECTED WORKS · 作品',
    heading: 'Built after hours, finished properly.',
  },
  aboutTeaser: {
    lineA: 'One person, off-hours, taken seriously.',
    lineB: 'Process, memory, and writing, built to last.',
    link: 'MORE ABOUT ME',
  },
  coda: {
    line: 'Every project lives on GitHub. Come wander.',
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
    bigLine: 'Built after hours, taken seriously.',
    copyright: '© 2026 阿黄 tdwhere',
    license: 'MIT for code',
  },
}

export const content: Record<Lang, Content> = { zh, en }
