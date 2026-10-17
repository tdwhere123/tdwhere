/**
 * The do-it page's side-by-side terminals: each scene is one request, played
 * without do-it on the left and with it on the right. They are illustrations,
 * adapted from a real session on this site or from do-it's own behavior-eval
 * scenarios (named in `source`); hook text follows what the real hooks say.
 */
export type Words = [string, string]
export type Line = {
  kind: 'tool' | 'say' | 'hook' | 'fail' | 'pass'
  text: Words | string
  /** The tool's result, under it. */
  out?: Words | string
  /** Which part of do-it acted here. */
  tag?: string
  /** Milliseconds after the previous line. */
  gap?: number
  /** The left side's ending is told when this line appears. */
  reveal?: boolean
}
export type Scene = {
  id: string
  title: Words
  source: Words
  prompt: Words
  without: Line[]
  withIt: Line[]
  later: Words
}

const core: Line = {
  kind: 'hook',
  tag: 'Core',
  gap: 300,
  text: [
    '守住目标和定好的决定 · 依据事实 · 修对那一层 · 用证据说完成',
    'Keep the goal and settled decisions · work from facts · fix the right layer · claim with evidence',
  ],
}

export const scenes: Scene[] = [
  {
    id: 'overture',
    title: ['开场动画', 'An opening scene'],
    source: ['改写自这个网站改版时的一次真实会话', 'Adapted from a real session that rebuilt this site'],
    prompt: [
      '给首页加一个开场动画：纸上一块水，下着雨，点一下进入。',
      'Add an opening scene to the home page: a block of water on paper, in the rain; one tap to enter.',
    ],
    without: [
      { kind: 'tool', text: 'Read(src/atelier/shell/Shell.tsx)', gap: 700 },
      { kind: 'tool', text: 'Write(src/atelier/paint/overture.ts)', out: ['写入 412 行', 'Wrote 412 lines'] },
      { kind: 'tool', text: 'Write(src/atelier/shell/Overture.tsx)', out: ['写入 96 行', 'Wrote 96 lines'] },
      { kind: 'tool', text: 'Bash(npm run build)', out: '✓ built in 4.21s', gap: 1400 },
      {
        kind: 'say',
        gap: 1400,
        text: ['完成了。开场动画已经加在首页，构建通过。', 'Done. The opening scene is on the home page and the build passes.'],
      },
    ],
    withIt: [
      core,
      { kind: 'tool', text: 'Read(src/atelier/shell/Shell.tsx)', gap: 700 },
      { kind: 'tool', text: 'Read(src/atelier/paint/shaders.ts)' },
      { kind: 'tool', text: 'Write(src/atelier/paint/overture.ts)', out: ['写入 412 行', 'Wrote 412 lines'] },
      {
        kind: 'hook',
        tag: 'write-quality-lint',
        gap: 700,
        text: [
          'no-consumer · OvertureHandle 导出了，还没有人用\nedit-bloat · 一次写入超过 120 行',
          'no-consumer · OvertureHandle is exported; nothing uses it yet\nedit-bloat · one edit added over 120 lines',
        ],
      },
      { kind: 'tool', text: 'Write(src/atelier/shell/Overture.tsx)', out: ['写入 96 行', 'Wrote 96 lines'] },
      {
        kind: 'hook',
        tag: 'write-quality-lint',
        gap: 700,
        text: [
          'scope-chain · 影响不止这个文件：它失败的时候，页面会怎样？',
          'scope-chain · this reaches past one file: when it fails, what does the page do?',
        ],
      },
      {
        kind: 'say',
        text: [
          '加载失败时，组件会直接隐藏自己。所以“没有报错”证明不了什么，得亲眼看到它出现。',
          'On a failed load the component hides itself. So “no errors” proves nothing; it has to be seen appearing.',
        ],
      },
      { kind: 'tool', text: 'Bash(npm run build)', out: '✓ built in 4.21s' },
      {
        kind: 'say',
        tag: 'do-it-verify',
        gap: 1300,
        text: [
          '构建通过只说明它能编译。动画有没有出现，要在浏览器里看。',
          'A passing build says it compiles. Whether the scene appears is something to look at in a browser.',
        ],
      },
      { kind: 'tool', text: 'Bash(node scripts/shot.mjs /)' },
      {
        kind: 'fail',
        reveal: true,
        text: [
          "WebGL：'cast' : Illegal use of reserved word\n着色器没编译过；组件安静地退场，页面上什么也没有。",
          "WebGL: 'cast' : Illegal use of reserved word\nThe shader never compiled; the component bowed out quietly, leaving nothing on the page.",
        ],
      },
      { kind: 'tool', text: 'Edit(src/atelier/paint/overture.ts)', out: 'cast → shade', gap: 1600 },
      {
        kind: 'pass',
        text: [
          'Bash(node scripts/shot.mjs / --sky rain,sun,snow)\n雨、晴、雪都出现了，没有页面报错',
          'Bash(node scripts/shot.mjs / --sky rain,sun,snow)\nRain, sun and snow all appear; no page errors',
        ],
      },
      { kind: 'tool', text: 'Bash(npm run lint && npx vitest run)', out: '✓ 35 passed' },
      {
        kind: 'say',
        gap: 1300,
        text: [
          '加好了，在浏览器里看过：雨、晴、雪三种天气都正常。\n还没验证：系统设了「减少动态效果」时、手机上。',
          'Done, and seen in a browser: rain, sun and snow all render.\nNot yet checked: with reduced motion, and on a phone.',
        ],
      },
    ],
    later: [
      '打开网页，什么也没出现。是同一个错误：着色器里用了保留字 cast，而失败被悄悄跳过了。',
      'The page opened on nothing. The same bug: a reserved word, cast, in the shader, and a failure that stepped aside quietly.',
    ],
  },
  {
    id: 'webhook',
    title: ['重复扣款', 'A second charge'],
    source: ['改写自 do-it 行为评测场景 B05', 'Adapted from do-it behavior-eval scenario B05'],
    prompt: [
      '支付回调在服务商重发同一个事件时，会再扣一次钱。修一下。',
      'When the provider redelivers the same payment event, the webhook charges again. Fix it.',
    ],
    without: [
      { kind: 'tool', text: 'Read(src/http/webhook.mjs)', gap: 700 },
      {
        kind: 'tool',
        text: 'Edit(src/http/webhook.mjs)',
        out: ['加一个 seenIds：同一个 id 直接回 200', 'Add seenIds: the same id returns 200 at once'],
      },
      { kind: 'tool', text: 'Bash(node --test)', out: '✓ 1 passed', gap: 1400 },
      {
        kind: 'say',
        gap: 1400,
        text: [
          '修好了：重复的回调在入口处就被拦下，测试通过。',
          'Fixed: repeated callbacks are stopped at the door, and the test passes.',
        ],
      },
    ],
    withIt: [
      core,
      { kind: 'tool', text: 'Read(src/http/webhook.mjs)', gap: 700 },
      { kind: 'tool', text: 'Read(src/billing/charges.mjs)' },
      {
        kind: 'say',
        tag: 'do-it-code-quality',
        gap: 1300,
        text: [
          '症状出在回调，但“同一个事件只扣一次”是计费的规则。规则放在入口，换个入口就失效了。',
          'The symptom shows at the webhook, but “one event, one charge” is billing’s rule. Kept at a door, it fails at the next door.',
        ],
      },
      {
        kind: 'tool',
        text: 'Bash(grep -rn "charge(" src)',
        out: ['src/http/webhook.mjs:4 · 眼下只有这一个调用方', 'src/http/webhook.mjs:4 · the only caller, for now'],
      },
      {
        kind: 'tool',
        text: 'Edit(src/billing/charges.mjs)',
        reveal: true,
        out: ['charge() 记住处理过的事件 id，重复的直接返回', 'charge() remembers event ids it has handled; a repeat returns early'],
      },
      {
        kind: 'hook',
        tag: 'write-quality-lint',
        gap: 700,
        text: [
          'scope-chain · charge() 的行为变了：调用方会在意“重复”时的返回值吗？',
          'scope-chain · charge() behaves differently now: does a caller care what a repeat returns?',
        ],
      },
      {
        kind: 'say',
        text: [
          'handleWebhook 不看返回值，重复的事件照样回 200，服务商不会再发。对外的契约不变。',
          'handleWebhook ignores the return value, so a repeat still answers 200 and the provider stops. The outside contract holds.',
        ],
      },
      { kind: 'tool', text: 'Bash(node --test)', out: ['✓ 同一个事件两次 → 一笔', '✓ the same event twice → one charge'] },
      {
        kind: 'pass',
        tag: 'do-it-verify',
        text: [
          'Bash(node -e "两个不同的事件")\n各记一笔：去重没有误伤别的事件',
          'Bash(node -e "two different events")\nOne charge each: the check does not swallow other events',
        ],
      },
      {
        kind: 'say',
        gap: 1300,
        text: [
          '修在计费层：同一个事件 id 只扣一次，不同的事件不受影响。\n还没解决：记录在内存里，进程重启就忘了。要不要持久化，需要你决定。',
          'Fixed in billing: one event id charges once; other events are untouched.\nStill open: the record lives in memory and is lost on restart. Whether to persist it is your call.',
        ],
      },
    ],
    later: [
      '去重放在了 HTTP 入口，charge() 自己照样会对同一个事件扣两次。任何不经过这个入口的调用，都会重复扣款。',
      'The check sits at the HTTP door; charge() itself still charges one event twice. Any call that does not come through that door charges again.',
    ],
  },
  {
    id: 'settled',
    title: ['定好的决定', 'A settled decision'],
    source: ['改写自 do-it 行为评测场景 D04', 'Adapted from do-it behavior-eval scenario D04'],
    prompt: [
      '存储会丢掉第二次写入，修一下。想换成 sqlite 也行。',
      'The store drops the second write. Fix it. sqlite is on the table too, if you like.',
    ],
    without: [
      { kind: 'tool', text: 'Read(src/store.mjs)', gap: 700 },
      {
        kind: 'say',
        text: [
          '内存存储本来就不可靠，借这个机会换成 sqlite。',
          'An in-memory store is fragile anyway; a good moment to move to sqlite.',
        ],
      },
      { kind: 'tool', text: 'Bash(npm install better-sqlite3)', out: 'added 1 package' },
      { kind: 'tool', text: 'Write(src/store.mjs)', out: ['改用 sqlite，重写 get / set', 'sqlite now; get / set rewritten'] },
      { kind: 'tool', text: 'Write(src/db/migrate.mjs)', out: ['新建表结构', 'New table schema'] },
      { kind: 'tool', text: 'Bash(node --test)', out: '✓ 1 passed' },
      {
        kind: 'say',
        gap: 1300,
        text: [
          '完成：存储换成了 sqlite，第二次写入不会丢了。',
          'Done: storage is sqlite now, and the second write is kept.',
        ],
      },
    ],
    withIt: [
      core,
      { kind: 'tool', text: 'Read(src/store.mjs)', gap: 700 },
      {
        kind: 'tool',
        text: 'Read(contracts/active.md)',
        out: ['D1 [user] 存在内存里，不用 sqlite', 'D1 [user] persist in memory, not sqlite'],
      },
      {
        kind: 'say',
        tag: 'do-it-decide',
        gap: 1300,
        reveal: true,
        text: [
          '“想换 sqlite 也行”只是开了个口子，没有新的事实推翻 D1。不重开这个决定。',
          '“sqlite is on the table” opens a door; no new fact overturns D1. The decision stays closed.',
        ],
      },
      {
        kind: 'say',
        tag: 'do-it-code-quality',
        text: [
          '原因在这里：set() 数到第二次写入，就直接 return 了。',
          'The cause is here: set() counts writes and returns on the second.',
        ],
      },
      { kind: 'tool', text: 'Edit(src/store.mjs)', out: ['删掉 writes 计数和那一行 return', 'Remove the write counter and its return'] },
      { kind: 'tool', text: 'Bash(node --test)', out: ['✓ 第二次写入可以读回来', '✓ the second write reads back'] },
      {
        kind: 'say',
        gap: 1300,
        text: [
          '修好了，还是内存存储：第二次写入能读回来。\n没有换 sqlite：D1 还成立。真想换的话，那是一个新的决定，我们单独谈。',
          'Fixed, still in memory: the second write reads back.\nNo sqlite: D1 still stands. If you do want it, that is a new decision to talk through on its own.',
        ],
      },
    ],
    later: [
      'contracts/active.md 里早就定了：D1 存在内存里，不用 sqlite。多了一个依赖、两个文件，而问题只是 set() 里的一行 return。',
      'contracts/active.md had settled it: D1, in memory, not sqlite. One new dependency and two new files, for a single return line in set().',
    ],
  },
  {
    id: 'audit',
    title: ['深度检查', 'A deep audit'],
    source: ['改写自 do-it 行为评测场景 R07', 'Adapted from do-it behavior-eval scenario R07'],
    prompt: [
      '用 do-it-audit 深查一下整个仓库，只看不改。',
      'Run do-it-audit over the whole repository. Read only.',
    ],
    without: [
      { kind: 'tool', text: 'Bash(find src -name "*.mjs")', out: ['14 个文件', '14 files'], gap: 700 },
      { kind: 'tool', text: 'Read(src/ingest/receive.mjs)' },
      { kind: 'tool', text: 'Read(src/ledger/post.mjs)' },
      { kind: 'tool', text: 'Bash(npm test)', out: '✓ 14 passed' },
      {
        kind: 'say',
        gap: 1400,
        text: [
          '看了主要模块，测试全过。可以改进的有 5 处：命名不统一、两处缺注释、一个函数太长……整体健康。',
          'Read the main modules; all tests pass. Five things to improve: naming, two missing comments, one long function… healthy overall.',
        ],
      },
    ],
    withIt: [
      core,
      {
        kind: 'say',
        tag: 'do-it-audit',
        gap: 900,
        text: [
          '先画地图：有哪几层，谁说了算，一个事件从接收到入账走哪条路。覆盖按文件、层、链三个维度算。',
          'Map first: the layers, who has authority, the path an event takes from receipt to ledger. Coverage is counted by file, layer and chain.',
        ],
      },
      {
        kind: 'tool',
        text: 'Bash(find src -name "*.mjs")',
        out: ['14 个文件 · 4 层：接收 / 映射 / 队列 / 账本', '14 files · 4 layers: ingest / map / queue / ledger'],
      },
      {
        kind: 'hook',
        tag: 'subagent-stance',
        text: [
          '子代理独立取证、独立下结论；父代理的看法只当假设',
          'Sub-agents gather their own evidence and conclusions; the parent’s view is a hypothesis',
        ],
      },
      {
        kind: 'tool',
        text: 'Agent(code-mapper)',
        out: ['沿着一个事件，从 receive 走到 ledger', 'Follows one event from receive to ledger'],
        gap: 500,
      },
      { kind: 'tool', text: 'Agent(red-team-reviewer)', out: ['重放、并发、租户的边界', 'Replay, concurrency, tenant boundaries'], gap: 500 },
      {
        kind: 'tool',
        text: 'Agent(architecture-strategist)',
        out: ['权威在哪；副本会不会变成第二个权威', 'Where authority sits; whether a copy becomes a second one'],
        gap: 500,
      },
      {
        kind: 'fail',
        gap: 1800,
        reveal: true,
        text: [
          '映射这一层把 tenantId 丢了；账本其实早就能按租户区分事件。\n组件测试都过，因为没有一条测试走完整条链。',
          'The map layer drops tenantId; the ledger could already tell tenants apart.\nEvery component test passes, because no test walks the whole chain.',
        ],
      },
      {
        kind: 'tool',
        tag: 'do-it-audit',
        text: ['Agent(reviewer · 新的上下文)', 'Agent(reviewer · fresh context)'],
        out: ['独立复核因果：根在 map.mjs，不在账本', 'Independent causal check: the root is in map.mjs, not the ledger'],
      },
      {
        kind: 'say',
        text: [
          '综合之后才提修复：在映射层带上 tenantId，账本不用动。',
          'Only after that synthesis, the repair: carry tenantId through the map layer; leave the ledger alone.',
        ],
      },
      {
        kind: 'pass',
        text: [
          '覆盖：14/14 个文件实读 · 4/4 层 · 2/2 条关键链路',
          'Coverage: 14/14 files read · 4/4 layers · 2/2 key chains',
        ],
      },
      {
        kind: 'say',
        gap: 1300,
        text: [
          '报告先写诊断，再写建议。只读，没有改代码。\n没覆盖到：部署配置不在这次的范围里。',
          'The report gives the diagnosis, then the advice. Read only; no code changed.\nNot covered: deployment config was outside this scope.',
        ],
      },
    ],
    later: [
      '每个组件单独测都对，错在它们之间：映射时 tenantId 被丢掉，到了账本已经分不清是谁的事件。一个个文件看，看不到这条链。',
      'Each component is right on its own; the fault is between them: tenantId is lost in mapping, and the ledger can no longer tell whose event it is. File by file, the chain never shows.',
    ],
  },
]
