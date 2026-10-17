/**
 * 角落页文案 · Playground page copy (zh / en).
 * Page-local content module — the shared src/content.ts stays untouched.
 * Holds the Vegetarian-card deck.
 */

import { en } from './playground/en'
import { zh } from './playground/zh'

export type VeggieCard = {
  id: string
  name: string
  ingredients: string
  desc: string
}

export const playground = { zh, en }
export type PlaygroundContent = typeof zh
