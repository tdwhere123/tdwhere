import type { Lang } from '@/context/LangContext'

/**
 * Shared bilingual copy. Components read from `t` (the active language tree).
 * Atelier currently uses `t.meta.email` / `t.meta.githubUrl`;
 * the preserved playground experiment still reads `t.common.nextRoom`.
 */
const zh = {
  meta: {
    email: 'tdwhere123@gmail.com',
    github: 'github.com/tdwhere123',
    githubUrl: 'https://github.com/tdwhere123',
  },
  common: {
    nextRoom: '下一间屋子',
  },
}

export type Content = typeof zh

const en: Content = {
  meta: {
    email: 'tdwhere123@gmail.com',
    github: 'github.com/tdwhere123',
    githubUrl: 'https://github.com/tdwhere123',
  },
  common: {
    nextRoom: 'Next room',
  },
}

export const content: Record<Lang, Content> = { zh, en }
