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
  works: {
    label: '作品 · SELECTED WORKS',
    heading: '业余时间，认真做完。',
    formula: {
      title: '记忆的数学骨架 · THE MATHEMATICS OF MEMORY',
      write: '写入即生长',
      propagate: '传播必有界',
      select: '选择受治理',
    },
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
  works: {
    label: 'SELECTED WORKS · 作品',
    heading: 'Built after hours, finished properly.',
    formula: {
      title: 'THE MATHEMATICS OF MEMORY · 记忆的数学骨架',
      write: 'WRITE IS GROWTH',
      propagate: 'PROPAGATION IS BOUNDED',
      select: 'SELECTION IS GOVERNED',
    },
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
