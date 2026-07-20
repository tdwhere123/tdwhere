import { asset } from '@/lib/asset'

/** localStorage key for unlocked concept-art cards. */
export const CARD_STORAGE_KEY = 'tdwhere-sentinel-cards'

/** @deprecated kept so old saves still migrate */
export const FRAGMENT_STORAGE_KEY = 'tdwhere-sentinel-fragments'

export type CardId = '01' | '02' | '03' | '04' | '05'

export type SentinelCard = {
  id: CardId
  /** Terminal commands that drop this card. */
  commands: string[]
  image: string
  /** Short museum label on the card face. */
  title: { zh: string; en: string }
  /** PRD gameplay lesson shown when the card drops. */
  lesson: { zh: string; en: string }
  /** One-line mechanic tag. */
  mechanic: { zh: string; en: string }
}

/**
 * Five concept-art cards ≈ five PRD pillars.
 * Image files: public/easter/sentinel/card-0N.png (user uploads).
 */
export const SENTINEL_CARDS: Record<CardId, SentinelCard> = {
  '01': {
    id: '01',
    commands: ['interrogate', '审讯', 'ask'],
    image: asset('easter/sentinel/card-01.png'),
    title: { zh: '卡片 I · 审讯终端', en: 'Card I · Interrogation' },
    mechanic: { zh: '与 SENTINEL 对话', en: 'Talk to SENTINEL' },
    lesson: {
      zh: '你用自然语言追问 SENTINEL，并提交选中的证据。每次提问消耗虚拟 Token——询问不是中立行为：你的措辞会塑造它如何回忆自己。',
      en: 'You interrogate SENTINEL in natural language while citing selected evidence. Each question spends virtual Tokens — asking is never neutral: your wording shapes how it remembers itself.',
    },
  },
  '02': {
    id: '02',
    commands: ['leads', '线索', 'investigate'],
    image: asset('easter/sentinel/card-02.png'),
    title: { zh: '卡片 II · 可用线索', en: 'Card II · Available Leads' },
    mechanic: { zh: '主动调查行动', en: 'Active investigation' },
    lesson: {
      zh: '每个事件给你有限的调查资源：追查引用、恢复损坏档案、请求受限材料、接受匿名泄露。遗漏不是失败——遗漏是你参与历史生产的方式。',
      en: 'Each event grants finite investigation resources: trace citations, repair damaged files, request restricted archives, accept anonymous leaks. Omission is not failure — it is how you take part in producing history.',
    },
  },
  '03': {
    id: '03',
    commands: ['materials', '材料', 'archive', '档案'],
    image: asset('easter/sentinel/card-03.png'),
    title: { zh: '卡片 III · 五选三', en: 'Card III · Five Choose Three' },
    mechanic: { zh: '候选材料', en: 'Candidate materials' },
    lesson: {
      zh: '事件开局出现五份候选材料，你免费完整调取三份。材料含预写锚点、预写变体与 AI 模拟档案——它们可以相互矛盾，且不等于客观真相。',
      en: 'Each event opens with five candidate materials; you may fully open three for free. Materials include prewritten anchors, variants, and AI-simulated archives — they can contradict each other, and none equal objective truth.',
    },
  },
  '04': {
    id: '04',
    commands: ['ledger', '账本', 'notebook'],
    image: asset('easter/sentinel/card-04.png'),
    title: { zh: '卡片 IV · 纸质账本', en: 'Card IV · Paper Ledger' },
    mechanic: { zh: '书写正式记录', en: 'Write the record' },
    lesson: {
      zh: '账本是私人记忆：草稿、矛盾、不愿进系统的判断。最终你要写出正式文章——标题、主张、证据勾连、不确定性声明——然后选择发布渠道。写作就是行动。',
      en: 'The ledger is private memory: drafts, contradictions, judgments you withhold from the system. Eventually you file a formal article — title, claims, evidence links, uncertainty — then choose a publish channel. Writing is action.',
    },
  },
  '05': {
    id: '05',
    commands: ['publish', '发布', 'history', '历史'],
    image: asset('easter/sentinel/card-05.png'),
    title: { zh: '卡片 V · 历史回流', en: 'Card V · History Recurs' },
    mechanic: { zh: '记录改变世界', en: 'Records reshape the world' },
    lesson: {
      zh: '你写下的文章会成为后续事件的历史前提：新证词、政策、教材与 SENTINEL 的自我认知都会引用它。记忆塑造现实——而你正在决定一个无法完整验证的过去，以什么形式继续存在。',
      en: 'Your article becomes the historical premise of later events: new testimony, policy, textbooks, and SENTINEL’s self-image will cite it. Memory shapes reality — and you decide in what form an unverifiable past continues to exist.',
    },
  },
}

export const ALL_CARD_IDS: CardId[] = ['01', '02', '03', '04', '05']

/** Flat lookup: normalized command → card id. */
export const COMMAND_TO_CARD = Object.values(SENTINEL_CARDS).reduce<Record<string, CardId>>(
  (acc, card) => {
    for (const cmd of card.commands) acc[cmd.toLowerCase()] = card.id
    return acc
  },
  {},
)

/**
 * Finale mask question — after all five cards are filed.
 * Inspired by PRD §4.3 final review / §12.3 / §22.
 */
export const FINALE_QUESTION = {
  zh: '当人类必须依赖一台 AI 的记忆，来判断这台 AI 是否可信——你最终将以什么身份，被历史保存？',
  en: 'When humans must rely on an AI’s memory to judge whether that AI is trustworthy — in what identity will history finally keep you?',
}

export const FINALE_SUB = {
  zh: 'Gibberish-SENTINEL · 五张卡片已齐 · 记忆审计未完',
  en: 'Gibberish-SENTINEL · five cards filed · the audit remains open',
}

function readStorage(key: string): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []
  } catch {
    return []
  }
}

function writeStorage(key: string, value: string[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* quota / private mode — fail silently */
  }
}

function migrateLegacyFragments(): CardId[] {
  const legacy = readStorage(FRAGMENT_STORAGE_KEY)
  const valid = legacy.filter((id): id is CardId => id in SENTINEL_CARDS)
  if (valid.length === 0) return []
  const current = readStorage(CARD_STORAGE_KEY)
  const merged = Array.from(new Set([...current, ...valid]))
  writeStorage(CARD_STORAGE_KEY, merged)
  try {
    window.localStorage.removeItem(FRAGMENT_STORAGE_KEY)
  } catch {
    /* ignore */
  }
  return merged.filter((id): id is CardId => id in SENTINEL_CARDS)
}

export function getUnlockedCards(): CardId[] {
  const ids = readStorage(CARD_STORAGE_KEY)
  const valid = ids.filter((id): id is CardId => id in SENTINEL_CARDS)
  if (valid.length === 0) return migrateLegacyFragments()
  return valid
}

export function isCardUnlocked(id: CardId): boolean {
  return getUnlockedCards().includes(id)
}

/** Returns true when the card was newly unlocked. */
export function unlockCard(id: CardId): boolean {
  const current = getUnlockedCards()
  if (current.includes(id)) return false
  writeStorage(CARD_STORAGE_KEY, [...current, id])
  return true
}

export function hasAllCards(): boolean {
  const unlocked = new Set(getUnlockedCards())
  return ALL_CARD_IDS.every((id) => unlocked.has(id))
}

export function getCardByCommand(cmd: string): SentinelCard | null {
  const id = COMMAND_TO_CARD[cmd.trim().toLowerCase()]
  return id ? SENTINEL_CARDS[id] : null
}

export function getCard(id: CardId): SentinelCard {
  return SENTINEL_CARDS[id]
}

export function unlockedCount(): number {
  return getUnlockedCards().length
}

/* ——— backwards-compatible aliases used by earlier scaffold ——— */
export type FragmentId = CardId
export type SentinelFragment = SentinelCard
export const SENTINEL_FRAGMENTS = SENTINEL_CARDS
export const getUnlockedFragments = getUnlockedCards
export const isFragmentUnlocked = isCardUnlocked
export const unlockFragment = unlockCard
export const getFragmentByCommand = getCardByCommand
export const getFragment = getCard
export const hasCoreFragments = hasAllCards
