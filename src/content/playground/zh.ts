export const zh = {
  header: {
    kicker: '— 肆 · 角落 CORNERS & RUINS',
    title: '角落',
    titleEn: 'Corners & Ruins',
    intro:
      '大项目讲道理，小项目讲兴致。这里有一台没做完的游戏机，和一叠越吃越多的素卡。',
  },
  veggie: {
    kicker: '— 06 · 抽屉 THE DRAWER',
    title: 'Vegetarian-card',
    blurb: '一个 AI 生成素食菜谱的小程序：做一道，解锁一张。',
    chips: ['Vue', '小程序'],
    github: 'GitHub →',
    draw: '抽一张今日素',
    drawAgain: '再抽一张',
    drawing: '翻牌中 …',
    tasted: '这味道你尝过了',
    newDish: '新菜入手',
    unlockedStamp: '已解锁 UNLOCKED',
    fullSetStamp: '素斋圆满 FULL SET',
    albumLabel: '集卡册',
    count: (n: number, total: number) => `已解锁 ${n} / ${total} · Unlocked ${n} / ${total}`,
    ingredientsLabel: '食材',
    cards: [
      { id: 'luohan', name: '罗汉斋', ingredients: '香菇·木耳·腐竹·荷兰豆', desc: '一锅焖出素鲜。' },
      { id: 'susanxian', name: '素三鲜', ingredients: '茄子·土豆·青椒', desc: '过油再收汁。' },
      { id: 'mapo', name: '麻婆豆腐（素）', ingredients: '豆腐·豆瓣酱·花椒', desc: '麻辣是态度。' },
      { id: 'qingcai', name: '香菇青菜', ingredients: '上海青·鲜香菇', desc: '三分钟的事。' },
      { id: 'nangua', name: '南瓜羹', ingredients: '老南瓜·糯米', desc: '秋天的颜色。' },
      { id: 'muer', name: '凉拌木耳', ingredients: '木耳·蒜·香醋', desc: '脆就是正义。' },
    ],
  },
  ruins: {
    kicker: '— 07 · 注脚 A NOTE ON RUINS',
    quotes: [
      '没做完的东西也配被展出吗？配。它证明你试过。',
      '这个院子里最诚实的展品，就是那台再也写不完的游戏机。',
    ],
  },
  plateRuins: {
    kicker: '— 展品 / THE RUIN',
    alt: '遗址展厅：未完成的终端机静置在石灰岩台座上，黄铜铭牌已氧化',
    caption: '遗址也配展出。机器还醒着——只是结局没写完。',
  },
  plateVeggie: {
    kicker: '— 展品 / THE DRAWER',
    alt: '素斋静物：陶盘里的时蔬与木耳，旁边叠着几张素卡',
    caption: '做一道，解锁一张。抽屉里的兴致，和正经项目一样认真。',
  },
  next: {
    title: '认识一下这个院子的主人 → 关于阿黄',
    subtitle: '自问自答、时间线，和联系方式。',
  },
}
