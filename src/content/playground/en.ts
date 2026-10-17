import type { zh } from './zh'

export const en: typeof zh = {
  header: {
    kicker: '— 04 · CORNERS & RUINS 角落',
    title: 'Corners & Ruins',
    titleEn: '角落',
    intro:
      'Big projects reason. Small ones play. Here: an unfinished game machine, and a deck of vegetarian cards.',
  },
  veggie: {
    kicker: '— 06 · THE DRAWER 抽屉',
    title: 'Vegetarian-card',
    blurb: 'A mini-app of AI-generated vegetarian recipes. Cook one, unlock one.',
    chips: ['Vue', 'Mini-program'],
    github: 'GitHub →',
    draw: "Draw today's card",
    drawAgain: 'Draw another',
    drawing: 'Flipping …',
    tasted: "You've tasted this one",
    newDish: 'New dish unlocked',
    unlockedStamp: 'UNLOCKED 已解锁',
    fullSetStamp: 'FULL SET 素斋圆满',
    albumLabel: 'Album',
    count: (n: number, total: number) => `Unlocked ${n} / ${total} · 已解锁 ${n} / ${total}`,
    ingredientsLabel: 'Ingredients',
    cards: [
      {
        id: 'luohan',
        name: 'Luohan Zhai',
        ingredients: 'shiitake · wood-ear · tofu skin · snow peas',
        desc: 'Braised mushrooms & tofu skin — umami without meat.',
      },
      {
        id: 'susanxian',
        name: 'Su Sanxian',
        ingredients: 'eggplant · potato · pepper',
        desc: 'Eggplant, potato, pepper — flash-fried, then glazed.',
      },
      {
        id: 'mapo',
        name: 'Mapo Tofu (veg)',
        ingredients: 'tofu · doubanjiang · sichuan pepper',
        desc: 'Mapo, minus the pork. The numbing stays.',
      },
      {
        id: 'qingcai',
        name: 'Greens & Shiitake',
        ingredients: 'shanghai greens · fresh shiitake',
        desc: 'Greens & shiitake. Three minutes.',
      },
      {
        id: 'nangua',
        name: 'Pumpkin Purée',
        ingredients: 'pumpkin · glutinous rice',
        desc: 'Pumpkin purée — autumn in a bowl.',
      },
      {
        id: 'muer',
        name: 'Wood-ear Salad',
        ingredients: 'wood-ear · garlic · black vinegar',
        desc: 'Wood-ear salad. Crunch is everything.',
      },
    ],
  },
  ruins: {
    kicker: '— 07 · A NOTE ON RUINS 注脚',
    quotes: [
      'Do unfinished things deserve a showcase? Yes. They prove you tried.',
      'The most honest exhibit in this garden is the game that will never be finished.',
    ],
  },
  plateRuins: {
    kicker: '— THE RUIN / 展品',
    alt: 'A ruin gallery: an unfinished terminal on a limestone plinth, brass nameplate oxidized',
    caption: 'Ruins deserve a wall. The machine is still awake — only the ending was never written.',
  },
  plateVeggie: {
    kicker: '— THE DRAWER / 展品',
    alt: 'Vegetarian still life: seasonal greens and wood-ear on clay, a few recipe cards beside',
    caption: 'Cook one, unlock one. Play in the drawer — taken as seriously as the big rooms.',
  },
  next: {
    title: 'Meet the gardener → About Ahuang',
    subtitle: 'Self Q&A, a timeline, and how to reach him.',
  },
}
