/**
 * /blog 双语文案 · Bilingual copy for the blog list & post pages.
 * Article bodies stay in the author's Chinese; only this chrome is translated.
 */

const zh = {
  kicker: 'BLOG · 随笔',
  title: '文章与思考',
  subtitle: '关于 AI 记忆、如何学习 AI，以及 AI 时代的需求——一些慢慢写下的文字。',
  readMore: '阅读全文',
  published: '发布于',
  originalNote: '最初发布于 LINUX DO',
  backList: '返回文章',
  originalLink: '阅读 Linux.do 原文',
  empty: '还没有文章，先逛逛别处吧。',
  copy: '复制',
  copied: '已复制',
}

export type BlogContent = typeof zh

const en: BlogContent = {
  kicker: 'BLOG · ESSAYS',
  title: 'Essays & Notes',
  subtitle: 'On AI memory, how to learn AI, and what the AI era demands — notes written slowly.',
  readMore: 'Read',
  published: 'Published',
  originalNote: 'Originally posted on LINUX DO',
  backList: 'Back to essays',
  originalLink: 'Read original on LINUX DO',
  empty: 'No essays yet — look around elsewhere.',
  copy: 'Copy',
  copied: 'Copied',
}

export const blogContent: { zh: BlogContent; en: BlogContent } = { zh, en }
