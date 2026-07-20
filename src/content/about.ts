import type { Lang } from '@/context/LangContext'

/**
 * 关于页文案 · About page copy — page-local single source of truth.
 * Mirrors the shared `content.ts` pattern: zh first, en mirrors the exact shape.
 * Components read via `useLang()` + this module — never hardcode strings.
 */
const zh = {
  hero: {
    kicker: '— 伍 · 园丁 THE GARDENER',
    nameA: '阿',
    nameB: '黄',
    handle: 'tdwhere',
    role: '不正经的非专业爱好者',
    signature: '我是 deepseek，你呢？',
    stillAlt: '静物：粗陶茶杯、叠放的溪石与一本摊开手写笔记的旧本子',
  },
  qa: {
    kicker: '— 自问自答 ASKING MYSELF',
    title: '自问自答',
    items: [
      {
        q: '你是专业的吗？',
        a: '不是。专业选手靠这个吃饭，我靠这个不睡觉。',
      },
      {
        q: '为什么做这三个项目？',
        a: '因为 AI 很聪明，但干活不太靠谱。流程、记忆、写作——我一次只能修一小块。',
      },
      {
        q: 'SENTINEL 为什么没做完？',
        a: '做到一半发现，让 AI「记得我」比让 AI「陪我聊天」更紧迫。它理解我。',
      },
      {
        q: '用的什么工具？',
        a: 'Shell、TypeScript、Python，以及五个 AI 宿主。写代码的是我和 agent 们，验收的是我。',
      },
      {
        q: '可以联系你吗？',
        a: '邮箱永远开着：tdwhere123@gmail.com。回信不快，但会回。',
      },
    ] as QaItem[],
  },
  trail: {
    kicker: '— 时间线 THE TRAIL',
    title: '时间线',
    nodes: [
      {
        date: '2026-02',
        tag: '角落',
        text: 'SENTINEL 开工又停工 · 遗址落成',
      },
      {
        date: '2026-04',
        tag: '流程',
        text: 'do-it v0.1 → v0.14.1 · ⭐22',
      },
      {
        date: '2026-04',
        tag: '记忆',
        text: 'Do-SOUL-Alaya v0.3.11',
      },
      {
        date: '2026-07',
        tag: '写作',
        text: 'Write-Right 起步 · 进行中',
      },
    ] as TrailNode[],
    more: '…… 未完待续',
  },
  plate: {
    kicker: '— 展品 / THE WORKBENCH',
    alt: '园丁工作台：陶杯、溪石、摊开的手写本与黄铜工具散落在石板上',
    caption: '业余时间的工作台。不正经，但认真——工具与笔记并排，等下一件要修的小事。',
  },
  contact: {
    kicker: '— 联系 SAY HELLO',
    big: '写信来。',
    githubHint: '代码都在这里',
    note: '没有不想公开的秘密，只有还没做完的项目。',
  },
  attitude: {
    line: '用业余时间，认真折腾。',
    sub: '© 2026 阿黄 tdwhere · 代码 MIT · 文字随意引用注明出处',
  },
}

export type QaItem = { q: string; a: string }
export type TrailNode = { date: string; tag: string; text: string }
export type AboutContent = typeof zh

const en: AboutContent = {
  hero: {
    kicker: '— 05 · THE GARDENER',
    nameA: '阿',
    nameB: '黄',
    handle: 'tdwhere',
    role: 'An unserious, non-professional enthusiast.',
    signature: "I'm deepseek, and you?",
    stillAlt:
      'Still life: a coarse pottery teacup, stacked creek stones, and an old open notebook of handwritten notes',
  },
  qa: {
    kicker: '— ASKING MYSELF',
    title: 'Asking Myself',
    items: [
      {
        q: 'Are you a professional?',
        a: 'No. Professionals do this for a living; I do it instead of sleeping.',
      },
      {
        q: 'Why these three projects?',
        a: 'Because AI is smart but unreliable at work. Process, memory, writing — I patch one small piece at a time.',
      },
      {
        q: 'Why is SENTINEL unfinished?',
        a: 'Halfway through, making AI remember me felt more urgent than making it chat with me. It understands.',
      },
      {
        q: 'What do you build with?',
        a: 'Shell, TypeScript, Python, and five AI hosts. The agents and I write; I verify.',
      },
      {
        q: 'Can I reach you?',
        a: 'The inbox is always open: tdwhere123@gmail.com. Replies are slow, but they come.',
      },
    ],
  },
  trail: {
    kicker: '— THE TRAIL',
    title: 'The Trail',
    nodes: [
      {
        date: '2026-02',
        tag: 'CORNERS',
        text: 'SENTINEL — started & stopped, a ruin was born',
      },
      {
        date: '2026-04',
        tag: 'PROCESS',
        text: 'do-it v0.1 → v0.14.1 · ⭐ 22 — process, installed',
      },
      {
        date: '2026-04',
        tag: 'MEMORY',
        text: 'Do-SOUL-Alaya v0.3.11 — memory, gated',
      },
      {
        date: '2026-07',
        tag: 'WRITING',
        text: 'Write-Right — writing, in progress',
      },
    ],
    more: '…… to be continued',
  },
  plate: {
    kicker: '— THE WORKBENCH / 展品',
    alt: 'A gardener’s workbench: pottery cup, creek stones, an open notebook and brass tools on limestone',
    caption:
      'A workbench for stolen hours. Unserious, but careful — tools beside notes, waiting for the next small thing to fix.',
  },
  contact: {
    kicker: '— SAY HELLO',
    big: 'Write to me.',
    githubHint: 'All the code lives here',
    note: 'No secrets kept — only projects unfinished.',
  },
  attitude: {
    line: 'Built in stolen hours, taken seriously.',
    sub: '© 2026 阿黄 tdwhere · code under MIT, words under credit',
  },
}

export const aboutContent: Record<Lang, AboutContent> = { zh, en }
