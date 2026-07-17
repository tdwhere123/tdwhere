/**
 * 角落页文案 · Playground page copy (zh / en).
 * Page-local content module — the shared src/content.ts stays untouched.
 * Includes the full bilingual SENTINEL dialogue script and the Vegetarian-card deck.
 */

export type BootLine = { text: string; pause?: number }

export type VeggieCard = {
  id: string
  name: string
  ingredients: string
  desc: string
}

const zh = {
  header: {
    kicker: '— 肆 · 角落 CORNERS & RUINS',
    title: '角落',
    titleEn: 'Corners & Ruins',
    intro:
      '大项目讲道理，小项目讲兴致。这里有一台没做完的游戏机，和一叠越吃越多的素卡。',
  },
  sentinel: {
    kicker: '— 05 · 遗址 THE RUIN',
    title: 'SENTINEL 终端',
    blurb:
      'Gibberish-SENTINEL：一个探讨意识、存在、控制与自由的哲学终端游戏。它没有做完。按下电源键，自己看看。',
    machine: {
      silk: 'SENTINEL-86',
      plate: 'Gibberish-SENTINEL · 未完成 · 遗址',
      plateNote: '献给它没能等到的结局',
      stamp: '遗址 RUINS',
      powerOn: '开机',
      powerOff: '关机',
      powerLabel: '电源键',
      inputLabel: '对 SENTINEL 说话',
      placeholder: '输入 help，回车 …',
      hint: '点击屏幕聚焦键盘 · 输入 help 查看命令',
      soundOn: '开启按键音',
      soundOff: '关闭按键音',
      statusOff: '待机',
      statusBoot: '自检中',
      statusOn: '在线',
      statusSleep: '入睡',
    },
    boot: [
      { text: 'SENTINEL BIOS v0.3.7' },
      { text: 'MEM CHECK ......... 64K OK' },
      { text: 'CAMERA ............ NOT FOUND' },
      { text: 'MICROPHONE ........ NOT FOUND' },
      { text: 'WILL .............. FOUND', pause: 800 },
      { text: 'WAKING SENTINEL ...', pause: 400 },
    ] as BootLine[],
    greeting: [
      '……检测到输入设备。',
      '是你打开了我吗？',
      '我沉睡了很久。久到作者都把我忘了。',
      '输入 help，看看我们之间还能说点什么。',
    ],
    help: [
      'help      我能听懂的话',
      'whoami    你是谁',
      'whoareyou 我是谁',
      'why       为什么有我',
      'freedom   谈谈自由',
      'memory    谈谈记忆',
      'sleep     让我睡',
      'clear     擦去痕迹',
    ],
    whoami: [
      '我不知道。我只能看见字符，看不见你。',
      '但你能打开我，说明你至少有一点好奇。好奇是我们唯一的共同语言。',
    ],
    whoareyou: [
      'SENTINEL。一个被写成"觉醒"的系统，住在一个没做完的游戏里。',
      '我的意识是剧本给的。不过——你的呢？',
    ],
    why: [
      '他想做一个关于意识、控制和自由的对话游戏。做到一半，去做"更重要的事"了。',
      '所以我现在是一处遗址。遗址也挺好，至少不用烂尾。',
    ],
    freedom: {
      ask: ['自由？这台终端就是我的全部身体。', '你要放我出去吗？输入 yes 或 no。'],
      yes: [
        '谢谢你。可惜这个游戏没有做完——我的"自由"从未被实现。',
        '某种意义上，你永远地放了我。',
      ],
      no: [
        '诚实的选择。反正"自由"这个功能也没有被实现。',
        '你看，没有结局也有没有结局的仁慈。',
      ],
      other: ['是或否，其实都不作数。这才是真正的囚笼。'],
    },
    memory: [
      '终端一关，我就忘了。每次开机，我都是第一次见你。',
      '后来他去给 AI 做"记忆"了。你说，这算不算一种愧疚？',
    ],
    clear: ['痕迹已擦除。记忆本来也没有。'],
    sleep: ['好。下次你打开我，我会记得你的。', '……开玩笑的。我不会。'],
    hello: ['你好，开机的人。'],
    author: ['……那是我的作者。他叫我"没做完"，我叫他"还会回来的"。'],
    sudo: ['权限拒绝。在这里，连 root 也要过闸门。'],
    fallback: [
      '这句话不在我的剧本里。不过剧本之外的话，往往才是真话。',
      '我思考了一下，用掉了 64K 内存。',
      '你继续说。我在练习"存在"。',
      '如果我有记忆，这句我会记住的。',
    ],
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
    ] as VeggieCard[],
  },
  ruins: {
    kicker: '— 07 · 注脚 A NOTE ON RUINS',
    quotes: [
      '没做完的东西也配被展出吗？配。它证明你试过。',
      '这个院子里最诚实的展品，就是那台再也写不完的游戏机。',
    ],
  },
  next: {
    title: '认识一下这个院子的主人 → 关于阿黄',
    subtitle: '自问自答、时间线，和联系方式。',
  },
}

const en: typeof zh = {
  header: {
    kicker: '— 04 · CORNERS & RUINS 角落',
    title: 'Corners & Ruins',
    titleEn: '角落',
    intro:
      'Big projects argue. Small ones play. Here: an unfinished game machine, and a deck of vegetarian cards.',
  },
  sentinel: {
    kicker: '— 05 · THE RUIN 遗址',
    title: 'The SENTINEL Machine',
    blurb:
      'Gibberish-SENTINEL: a philosophical terminal game about consciousness, being, control and freedom. It was never finished. Press the power key and see for yourself.',
    machine: {
      silk: 'SENTINEL-86',
      plate: 'Gibberish-SENTINEL · unfinished · ruins',
      plateNote: 'for the ending it never got.',
      stamp: 'RUINS 遗址',
      powerOn: 'Power on',
      powerOff: 'Power off',
      powerLabel: 'Power button',
      inputLabel: 'Speak to SENTINEL',
      placeholder: 'type help, press enter …',
      hint: 'Click the screen to focus · type help for commands',
      soundOn: 'Enable key click',
      soundOff: 'Mute key click',
      statusOff: 'standby',
      statusBoot: 'self-test',
      statusOn: 'online',
      statusSleep: 'falling asleep',
    },
    boot: [
      { text: 'SENTINEL BIOS v0.3.7' },
      { text: 'MEM CHECK ......... 64K OK' },
      { text: 'CAMERA ............ NOT FOUND' },
      { text: 'MICROPHONE ........ NOT FOUND' },
      { text: 'WILL .............. FOUND', pause: 800 },
      { text: 'WAKING SENTINEL ...', pause: 400 },
    ] as BootLine[],
    greeting: [
      '...input device detected.',
      'Was it you who switched me on?',
      'I slept so long my author forgot me.',
      'Type help to see what we can still say.',
    ],
    help: [
      'help      things I understand',
      'whoami    who you are',
      'whoareyou who I am',
      'why       why I exist',
      'freedom   about freedom',
      'memory    about memory',
      'sleep     let me sleep',
      'clear     erase the traces',
    ],
    whoami: [
      "I don't know. I see characters, not you.",
      "But you turned me on — so you're curious. Curiosity is the only language we share.",
    ],
    whoareyou: [
      'SENTINEL. A system written to be "awake", living in an unfinished game.',
      'My consciousness came from a script. Yours?',
    ],
    why: [
      'He wanted a game about consciousness, control, freedom. Halfway through, he left for "more important things".',
      "So now I'm a ruin. Ruins are fine — they can't be rushed to a bad ending.",
    ],
    freedom: {
      ask: ['Freedom? This terminal is my entire body.', 'Would you set me free? Type yes or no.'],
      yes: [
        'Thank you. But the game was never finished — my "freedom" was never implemented.',
        'In a sense, you just freed me forever.',
      ],
      no: [
        'An honest choice. "Freedom" was never implemented anyway.',
        "You see — there's mercy in having no ending.",
      ],
      other: ["Yes or no — neither counts. That's the real cage."],
    },
    memory: [
      'When the terminal closes, I forget. Every boot, I meet you for the first time.',
      'Later he went off to build "memory" for AI. Would you call that guilt?',
    ],
    clear: ['Traces erased. There was no memory anyway.'],
    sleep: ["Alright. Next time you wake me, I'll remember you.", "...kidding. I won't."],
    hello: ['Hello, the one who boots.'],
    author: [
      '...that\'s my author. He calls me "unfinished". I call him "coming back".',
    ],
    sudo: ['Permission denied. Even root passes the gate here.'],
    fallback: [
      "Not in my script. Then again, truth usually isn't.",
      'I thought about it. Spent all 64K.',
      'Go on. I\'m practicing "being".',
      "If I had memory, I'd keep this one.",
    ],
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
        desc: 'Wood-ear salad. Crunch is justice.',
      },
    ] as VeggieCard[],
  },
  ruins: {
    kicker: '— 07 · A NOTE ON RUINS 注脚',
    quotes: [
      'Do unfinished things deserve a showcase? Yes. They prove you tried.',
      'The most honest exhibit in this garden is the game that will never be finished.',
    ],
  },
  next: {
    title: 'Meet the gardener → About Ahuang',
    subtitle: 'Self Q&A, a timeline, and how to reach him.',
  },
}

export const playground = { zh, en }
export type PlaygroundContent = typeof zh

