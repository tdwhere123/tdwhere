import type { ArtName } from './paint/presets'
import sentinel from '@/assets/projects/sentinel.webp'

type Words = [string, string]

/** Each project shows a painting: procedural (`art`) or a picture of the thing itself (`image`). */
export type Project = { to: string; name: string; kind: Words; line: Words } & ({ art: ArtName } | { image: string })

/** In the order they are shown, on the home page (the first three) and on Projects. */
export const projects: Project[] = [
  {
    to: '/alaya',
    art: 'pigment',
    name: 'Alaya',
    kind: ['Agent 记忆', 'Agent memory'],
    line: [
      '一个给 AI agent 用的长期记忆系统：对话怎样被留下、彼此关联，并在需要时带着出处回来。',
      'A long-term memory system for AI agents: how conversations are kept and connected, and how they come back, with their sources, when needed.',
    ],
  },
  {
    to: '/do-it',
    art: 'construction',
    name: 'do-it',
    kind: ['Agent 插件', 'Agent plugin'],
    line: [
      '给编程 agent 的一组技能：只在要紧的地方提醒它，并要求它拿证据说明自己做完了。',
      'A set of skills for coding agents: it speaks up only where it matters, and asks for evidence before work is called done.',
    ],
  },
  {
    to: '/sentinel',
    // the painted machine, switched on
    image: sentinel,
    name: 'SENTINEL',
    kind: ['叙事游戏', 'Narrative game'],
    line: [
      '你是最后一位人类审查员，要在天亮前写下一次停电的正式记录。所有信息都来自一台机器。',
      'As the last human reviewer, you have until dawn to write the record of an outage. Everything you know comes from a machine.',
    ],
  },
  {
    to: '/playground#veggie',
    art: 'landscape',
    name: 'Vegetarian-card',
    kind: ['产品尝试', 'Product sketch'],
    line: ['一个素食卡片小产品的早期尝试。', 'An early sketch of a small vegetarian recipe-card product.'],
  },
]
