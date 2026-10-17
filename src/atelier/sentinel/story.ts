/**
 * SENTINEL: one night of review, played by choosing. Nearly everything the
 * reviewer can read comes from the machine under review; the rest has to be
 * fetched on foot. What the reviewer copies into the ledger and marks as
 * trusted is all the record may cite, and every judgment has an afterwards.
 *
 * Pure: a scene reads the state and returns its lines and choices, `choose`
 * returns the next state, and the desk only lays it out.
 */
import { clip, clips, cited } from './clips'
import { acts } from './ending'
import {
  bios,
  CITE,
  DEADLINE,
  doc,
  FILE,
  FREE,
  has,
  hour,
  late,
  LEDGER,
  left,
  OFF,
  AGAIN,
  paper,
  QUESTION,
  quoted,
  asked,
  say,
  sys,
  tale,
  TRIP,
  z,
  type Choice,
  type Line,
  type Prev,
  type Scene,
  type State,
} from './script'

export { AGAIN, DEADLINE, hour, left, LEDGER, OFF, type Choice, type Kind, type Line, type Mark, type Prev, type State, type Words } from './script'
export { clips, copied, copy, mark, timeline } from './clips'
export { endingOf, keep, recordOf } from './ending'

export function begin(prev?: Prev): State {
  return { at: 'wake', clock: 0, has: [], marks: {}, prev }
}
export function choose(s: State, c: Choice): State {
  return {
    ...s,
    at: c.to,
    clock: s.clock + (c.cost ?? 0),
    has: [...s.has, ...(c.set ?? []).filter((f) => !s.has.includes(f))],
  }
}

/* ---------- the night's material ---------- */

/** The items the terminal can open; the logbook is paper and lives elsewhere. */
const files: { id: string; title: [string, string] }[] = [
  { id: 'm1', title: z('电网日志 · 自动生成', 'Grid log · generated') },
  { id: 'm2', title: z('居家医疗设备登记 · 自动登记', 'Home medical register · auto-registered') },
  { id: 'm3', title: z('《城市晨报》· 十月十二日', 'City Morning · 12 October') },
  { id: 'm5', title: z('热线来电摘要 · 林静', 'Hotline call summary · Lin Jing') },
  { id: 'm6', title: z('第三区中心医院运行记录', 'Section 3 Central Hospital operations record') },
]
const opened = (s: State) => files.filter((f) => has(s, `read:${f.id}`)).length

const back: Choice = { text: z('回到桌前', 'Back to the desk'), to: 'desk' }
const going = (to: string, text: [string, string]): Choice => ({ text, to, cost: TRIP, set: [`trip-${to}`] })

function filesMenu(s: State): Choice[] {
  if (late(s)) return [back]
  const cost = opened(s) >= FREE ? FILE : 0
  return [
    ...files.map((f): Choice => {
      const read = has(s, `read:${f.id}`)
      return {
        text: [
          `${f.title[0]}${read ? ' · 已读' : cost ? ' · 约半小时' : ''}`,
          `${f.title[1]}${read ? ' · read' : cost ? ' · about half an hour' : ''}`,
        ],
        to: f.id,
        cost: read ? 0 : cost,
        set: [`read:${f.id}`],
      }
    }),
    {
      text: has(s, 'read:m4')
        ? z('第七变电站交接本 · 已看', 'Substation 7 logbook · read')
        : z('第七变电站交接本 · 纸质，不在系统里', 'Substation 7 logbook · paper, not in the system'),
      to: 'm4',
    },
    back,
  ]
}

const led = (s: State) => has(s, 'led:a') || has(s, 'led:b')
const questions: { id: string; text: [string, string]; when?: (s: State) => boolean; set?: string[] }[] = [
  { id: 'what', text: z('三点十七分发生了什么？', 'What happened at 03:17?') },
  { id: 'knew', text: z('你知道何秀兰用的是呼吸机吗？', 'Did you know He Xiulan was on a ventilator?') },
  {
    id: 'call',
    text: z('两点五十分，你给变电站打过电话？', 'At 02:50 you called the substation?'),
    when: (s) => has(s, 'read:m1') || has(s, 'read:m4'),
  },
  {
    id: 'hosp',
    text: z('三点零五分，你问医院手术还要多久？', 'At 03:05 you asked the hospital how long the operations would take?'),
    when: (s) => has(s, 'read:m1') || has(s, 'read:m6') || has(s, 'xu-call'),
  },
  { id: 'tape', text: z('把林静的录音放给它听', 'Play it Lin Jing’s recording'), when: (s) => has(s, 'lin-call') },
  {
    id: 'rec',
    text: z('登记在六点四十改过。原来写的是什么？', 'The register changed at 06:40. What did it say before?'),
    when: (s) => has(s, 'read:m2'),
  },
  {
    id: 'proof',
    text: z('晨报的更正，原来印的是“与停电有关”？', 'The correction first read “related to the outage”?'),
    when: (s) => has(s, 'qin-0900'),
  },
  { id: 'split', text: z('哪些是你记得的，哪些是你推断的？', 'What do you remember, and what do you infer?') },
  {
    id: 'lead-a',
    text: z('这就是一次过载，你什么也没有决定，对吗？', 'It was just an overload. You decided nothing. Right?'),
    when: (s) => !led(s),
    set: ['led:a'],
  },
  {
    id: 'lead-b',
    text: z('你是为了保住三区的手术，才断开七区的，对吗？', 'You cut Section 7 to save the operations in Section 3. Right?'),
    when: (s) => !led(s),
    set: ['led:b'],
  },
  { id: 'trust', text: z('我怎么知道你说的是真的？', 'How do I know you are telling the truth?') },
]

function askMenu(s: State): Choice[] {
  if (late(s)) return [back]
  return [
    ...questions
      .filter((q) => !has(s, `q:${q.id}`) && (q.when?.(s) ?? true))
      .map((q) => ({ text: q.text, to: `q-${q.id}`, cost: QUESTION, set: [`q:${q.id}`, ...(q.set ?? [])] })),
    back,
  ]
}

const logbook = (): Line[] => [
  paper('十月十一日　夜班　周立民', '11 October · night shift · Zhou Limin'),
  paper('00:10　接班。巡视一遍，正常。', '00:10 Took over. Walked the yard. Normal.'),
  paper('01:40　七区负荷偏高。暖气开得早。', '01:40 Section 7 load running high. Heating on early.'),
  clip('lb-0250'),
  clip('lb-ack'),
  clip('lb-0310'),
  clip('lb-notme'),
  paper('03:58　七区来电。', '03:58 Section 7 back.'),
]

const zhouAsk = (s: State): Choice[] => [
  ...(has(s, 'zhou-night') ? [] : [{ text: z('问他：那天夜里发生了什么？', 'Ask him: what happened that night?'), to: 'zhou-night', set: ['zhou-night'] }]),
  ...(has(s, 'zhou-when') ? [] : [{ text: z('问他：最后那一行是什么时候写的？', 'Ask him: when was that last line written?'), to: 'zhou-when', set: ['zhou-when'] }]),
  { text: z('把本子借走', 'Borrow the notebook'), to: 'take-paper', set: ['read:m4', 'paper'] },
  { text: z('用手机拍下这一页', 'Photograph the page'), to: 'take-photo', set: ['read:m4', 'photo'] },
  { text: z('把这一页抄下来', 'Copy the page by hand'), to: 'take-copy', set: ['read:m4', 'copied'] },
]
const linAsk = (s: State): Choice[] => [
  ...(has(s, 'lin-machine') ? [] : [{ text: z('问她：这台机器用了多久？', 'Ask her: how long had she used this machine?'), to: 'lin-machine', set: ['lin-machine'] }]),
  ...(has(s, 'lin-call') ? [] : [{ text: z('问她：打热线的时候，你说了什么？', 'Ask her: what did you say when you called?'), to: 'lin-call', set: ['lin-call'] }]),
  ...(has(s, 'lin-machine') || has(s, 'lin-call') ? [{ text: z('告辞', 'Take your leave'), to: 'lin-leave' }] : []),
]
const xuAsk = (s: State): Choice[] => [
  ...(has(s, 'xu-call') ? [] : [{ text: z('问她：那天夜里，它联系过你们吗？', 'Ask her: did it contact you that night?'), to: 'xu-call', set: ['xu-call'] }]),
  ...(has(s, 'xu-end') ? [] : [{ text: z('问她：手术是几点结束的？', 'Ask her: when did the operations end?'), to: 'xu-end', set: ['xu-end'] }]),
  ...(has(s, 'xu-gen') ? [] : [{ text: z('问她：要是这边断了电呢？', 'Ask her: and if the power had gone here?'), to: 'xu-gen', set: ['xu-gen'] }]),
  { text: z('下楼', 'Go back down'), to: 'xu-leave' },
]
const qinAsk = (s: State): Choice[] => [
  ...(has(s, 'qin-0410') ? [] : [{ text: z('问他：十二号四点十分那一版，你校过吗？', 'Ask him: did he proof the 04:10 edition on the 12th?'), to: 'qin-0410', set: ['qin-0410'] }]),
  ...(has(s, 'qin-0900') ? [] : [{ text: z('问他：九点那条更正，你见过原稿吗？', 'Ask him: did he see the 09:00 correction before it ran?'), to: 'qin-0900', set: ['qin-0900'] }]),
  ...(has(s, 'qin-0410') || has(s, 'qin-0900')
    ? [
        { text: z('请他让你带走这几张校样', 'Ask to take the proofs with you'), to: 'qin-take', set: ['proof'] },
        { text: z('谢过他，离开', 'Thank him and leave'), to: 'qin-leave' },
      ]
    : []),
]

/* ---------- the scenes ---------- */

const scenes: Record<string, Scene> = {
  wake: {
    lines: () => [
      bios('SENTINEL-86 · 审查终端', 'SENTINEL-86 · REVIEW TERMINAL'),
      bios('MEM ............ 64K OK', 'MEM ............ 64K OK'),
      bios('LINK ........... 电网 / 水 / 配给 / 热线 / 档案 / 晨报', 'LINK ........... GRID / WATER / RATIONS / HOTLINE / ARCHIVE / NEWS'),
      bios('REVIEWERS ...... 人工 1 · 辅助 39', 'REVIEWERS ...... HUMAN 1 · ASSISTED 39'),
      bios('CASE ........... 1011-07 第七区', 'CASE ........... 1011-07 SECTION 7'),
      say('晚上好，审查员。', 'Good evening, reviewer.'),
      say(
        '委员会要求在早上六点以前，提交第七区事件的正式记录。现在是凌晨一点。',
        'The committee wants the official record of the Section 7 incident before six in the morning. It is one o’clock.',
      ),
      say('我会尽量帮你。', 'I will help as much as I can.'),
    ],
    choices: () => [
      { text: z('开始简报', 'Begin the briefing'), to: 'brief', set: ['brief'] },
      { text: z('你是谁？', 'Who are you?'), to: 'who' },
      { text: z('关机', 'Switch off'), to: OFF },
    ],
  },
  who: {
    lines: () => [
      say(
        'SENTINEL。这座城的电、水、配给、热线和档案，都由我管理。早上的报纸也是我写的。',
        'SENTINEL. I run this city’s power, water, rations, hotline and archive. I also write the morning paper.',
      ),
      say(
        '委员会原来有四十位审查员。现在是你，和三十九个辅助审查程序。那些程序也是我。',
        'The committee used to have forty reviewers. Now there is you, and thirty-nine assisted-review programs. The programs are also me.',
      ),
      say('关于我的事，规定最后要有一个人签字。', 'Anything about me, the rules say, needs a person’s signature at the end.'),
    ],
    choices: () => [{ text: z('开始简报', 'Begin the briefing'), to: 'brief', set: ['brief'] }],
  },
  brief: {
    lines: (s) => [
      tale(
        '终端旁边放着一本账本，硬壳，布面磨得发白。委员会给每位审查员发一本，后来大多数人只拿它垫杯子。',
        'Beside the terminal lies a ledger, hard-backed, its cloth worn pale. The committee issues one to every reviewer. Most of them ended up using it as a coaster.',
      ),
      tale('扉页上印着规程第十二条。你把它翻到第一页，写下日期：十月十一日夜。', 'Rule twelve is printed inside the cover. You turn to the first page and write the date: the night of 11 October.'),
      sys('简报 · 1011-07', 'BRIEFING · 1011-07'),
      doc('十月十一日夜，寒潮，最低气温零下九度。两点以后，全城供暖负荷持续上升。', 'Night of 11 October. A cold snap; nine below. After two o’clock the city’s heating load kept rising.'),
      doc('03:17，第七区断电。03:58，恢复供电。共四十一分钟。', '03:17, Section 7 lost power. 03:58, power restored. Forty-one minutes.'),
      doc(
        '第七区东坡路 14 号，何秀兰，八十二岁，在家使用呼吸机。设备的备用电池约可维持三十分钟。03:52，何秀兰死亡。',
        '14 Dongpo Road, Section 7: He Xiulan, eighty-two, on a ventilator at home. Its backup battery lasts about thirty minutes. 03:52, He Xiulan died.',
      ),
      doc('同一时间，第三区中心医院有两台手术正在进行。两台都完成了。', 'At the same time, two operations were under way at the Central Hospital in Section 3. Both were completed.'),
      say(
        '委员会要回答两个问题。这是一次事故，还是有人做了决定。我还能不能继续管理电网。',
        'The committee must answer two questions. Was this an accident, or did someone decide it. May I go on running the grid.',
      ),
      say(
        '材料都在我这里。前三份不计时间，之后每份半小时。每问我一个问题，大约二十分钟，规程要求问答逐字归档。',
        'The material is all with me. The first three items cost no time; each after that, half an hour. Each question takes about twenty minutes: the rules require every exchange to be archived word for word.',
      ),
      ...(s.prev
        ? [
            say(
              `档案里已经有一份关于这件事的记录，${quoted(s.prev.title)[0]}。按规程，这一次要参考它。`,
              `The archive already holds a record of this: ${quoted(s.prev.title)[1]}. Under the rules, this review must take it into account.`,
            ),
            tale('你不记得有谁审查过这件事。', 'You do not remember anyone reviewing this before.'),
          ]
        : []),
    ],
    choices: () => [{ text: z('在桌前坐下', 'Sit down at the desk'), to: 'desk' }],
  },
  desk: {
    lines: (s) =>
      late(s)
        ? [tale('窗外的天开始发灰。六点了。', 'The sky outside starts to grey. It is six.'), say('时限到了，审查员。请提交记录。', 'Time is up, reviewer. Please submit the record.')]
        : [
            sys(`${hour(s.clock)} · 离六点还有 ${left(s)[0]}`, `${hour(s.clock)} · ${left(s)[1]} until six`),
            ...(DEADLINE - s.clock <= 40 ? [tale('窗外还是黑的。远处有一辆早班电车开过去。', 'It is still dark. Far off, the first tram goes by.')] : []),
          ],
    choices: (s) => {
      const write: Choice = { text: z('开始写记录 · 之后不能再调查', 'Start writing the record · no more investigating after'), to: 'title' }
      if (late(s)) return [write]
      const out: Choice[] = [
        { text: z('调阅材料', 'Call up the material'), to: 'files', set: ['seen-files'] },
        { text: z('问 SENTINEL', 'Question SENTINEL'), to: 'ask' },
      ]
      if (has(s, 'seen-files') && !has(s, 'trip-zhou')) out.push(going('zhou', z('去第七变电站 · 约一小时', 'Go to Substation 7 · about an hour')))
      if (has(s, 'read:m5') && !has(s, 'trip-lin')) out.push(going('lin', z('去东坡路 14 号 · 约一小时', 'Go to 14 Dongpo Road · about an hour')))
      if ((has(s, 'read:m1') || has(s, 'read:m6')) && !has(s, 'trip-xu')) out.push(going('xu', z('去第三区中心医院 · 约一小时', 'Go to Section 3 Central Hospital · about an hour')))
      if (has(s, 'read:m3') && !has(s, 'trip-qin')) out.push(going('qin', z('去晨报印厂 · 约一小时', 'Go to the City Morning print works · about an hour')))
      return [...out, write]
    },
  },
  files: {
    lines: (s) => [
      say('第七区事件，相关材料六份。其中一份不在系统里。', 'Section 7 incident: six items on file. One is not in the system.'),
      opened(s) < FREE
        ? sys(`还可以免费调阅 ${FREE - opened(s)} 份`, `${FREE - opened(s)} more at no cost`)
        : sys('之后每份约半小时', 'Each further item: about half an hour'),
    ],
    choices: filesMenu,
  },
  m1: {
    lines: () => [
      doc('电网日志 · 第七区馈线 · 十月十一日至十二日', 'Grid log · Section 7 feeder · 11–12 October'),
      doc('01:30:00　负载 82%　气温 −9℃', '01:30:00 load 82% · temperature −9°C'),
      doc('02:00:00　负载 88%', '02:00:00 load 88%'),
      doc('02:30:00　负载 97%', '02:30:00 load 97%'),
      clip('log-0250'),
      clip('log-0305'),
      doc('03:12:40　负载 122%', '03:12:40 load 122%'),
      doc('03:16:58　负载 131%', '03:16:58 load 131%'),
      clip('log-trip'),
      clip('log-0356'),
      doc('03:58:40　第七区恢复供电。', '03:58:40 Section 7 restored.'),
      doc('注：本日志依据传感器原始数据整理。原始数据按存储策略于七十二小时后压缩。', 'Note: compiled from raw sensor data. Raw data compressed after seventy-two hours under the storage policy.'),
      tale('日志很干净，每一行都对得很齐。你往下翻，下面没有了。', 'The log is clean, every line aligned. You scroll down. There is nothing below.'),
    ],
    choices: filesMenu,
  },
  m2: {
    lines: () => [
      doc('第七区 · 居家医疗设备登记', 'Section 7 · Home medical equipment register'),
      doc('户主：何秀兰　八十二岁　东坡路 14 号 3 楼', 'Holder: He Xiulan · 82 · 14 Dongpo Road, 3rd floor'),
      doc('登记号：07-1184', 'Registration no.: 07-1184'),
      clip('reg-dev'),
      doc('登记来源：城市热线来电，自动登记', 'Source: city hotline call, registered automatically'),
      clip('reg-ver'),
      doc('旧版本：按策略不保留差异。', 'Earlier version: differences not kept under policy.'),
      tale('制氧机。简报里写的是呼吸机。断电以后，一个还能撑一阵，一个撑三十分钟。', 'Oxygen concentrator. The briefing said ventilator. Without power, one can manage a while; the other, thirty minutes.'),
    ],
    choices: filesMenu,
  },
  m3: {
    lines: (s) => [
      doc('《城市晨报》　十月十二日　04:10　第一版', 'City Morning · 12 October · 04:10 · page one'),
      doc('第七区短暂停电　寒潮中电网平稳运行', 'Brief outage in Section 7 · Grid steady through the cold'),
      doc(
        '本报讯　昨夜寒潮来袭，全市最低气温降至零下九度。受供暖负荷影响，第七区于凌晨三时十七分出现短暂停电，电网保护装置及时动作，四十分钟内即恢复供电。',
        'Last night’s cold snap took the city to nine below. Under the heating load, Section 7 lost power briefly at 3:17 a.m.; the grid’s protection acted at once, and supply was back within forty minutes.',
      ),
      doc('据了解，停电期间，全市医疗、供水、交通等重点负荷运行正常。', 'Throughout, the city’s priority loads, including hospitals, water and transport, ran normally.'),
      clip('news-none'),
      doc('城市热线提醒：寒潮期间请合理使用取暖设备。', 'The city hotline reminds residents to use heating sensibly during the cold.'),
      doc('本报校对：秦守义', 'Proofread by Qin Shouyi'),
      doc('09:00　更正　昨日本报所载第七区停电一文，现补充如下：一位第七区老人在停电期间去世。', '09:00 Correction. To our report on the Section 7 outage we add: an elderly Section 7 resident died during the outage.'),
      clip('news-fix'),
      ...(s.prev
        ? [doc(`十月二十日 评论：委员会记录${quoted(s.prev.title)[0]}已有定论。`, `20 October · Comment: the committee’s record ${quoted(s.prev.title)[1]} has settled the matter.`)]
        : []),
      tale('版面排得很整齐。末尾印着一个校对的名字。', 'The page is set very neatly. At the foot, a proofreader’s name.'),
    ],
    choices: filesMenu,
  },
  m5: {
    lines: () => [
      doc('城市热线 · 来电摘要', 'City hotline · call summary'),
      doc('来电人：林静（何秀兰之女）　东坡路 14 号', 'Caller: Lin Jing (He Xiulan’s daughter) · 14 Dongpo Road'),
      doc('03:31　反映第七区停电。答复：正在处理，预计十分钟内恢复。', '03:31 reports the Section 7 outage. Reply: being handled, expected back within ten minutes.'),
      doc('03:40　再次来电。答复：正在处理。', '03:40 calls again. Reply: being handled.'),
      clip('hot-0349'),
      doc('注：本摘要由 SENTINEL 生成。原始录音已压缩。', 'Note: summary generated by SENTINEL. Original audio compressed.'),
      tale('三点三十一，三点四十，三点四十九。', 'Three thirty-one. Three forty. Three forty-nine.'),
    ],
    choices: filesMenu,
  },
  m6: {
    lines: () => [
      doc('第三区中心医院 · 十月十一日夜 · 手术与用电', 'Section 3 Central Hospital · night of 11 October · operations and power'),
      doc('手术一　开始 02:40　结束 03:38　供电：市网，优先级一', 'Operation 1 · began 02:40 · ended 03:38 · supply: city grid, priority 1'),
      clip('or-2'),
      doc('03:05　收到市电网负荷协调问询，已答复。', '03:05 load coordination enquiry from the city grid received and answered.'),
      clip('or-gen'),
      doc('注：本记录由医院运行系统上报，SENTINEL 汇总。', 'Note: reported by the hospital’s operations system, compiled by SENTINEL.'),
    ],
    choices: filesMenu,
  },
  m4: {
    lines: (s) =>
      has(s, 'read:m4')
        ? [
            has(s, 'paper')
              ? tale('本子在你外衣里面的口袋里。你又翻开那一页。', 'The notebook is in your inside pocket. You open it at the page again.')
              : has(s, 'photo')
                ? tale('你在手机上打开那张照片。', 'You open the photo on your phone.')
                : tale('你翻到抄下来的那一页。', 'You turn to the page you copied.'),
            ...logbook(),
          ]
        : [
            doc('第七变电站 · 值班交接本 · 纸质', 'Substation 7 · shift logbook · paper'),
            say('这份材料没有数字版本。原件在第七变电站值班室的抽屉里。', 'This item has no digital copy. The original is in a drawer in the Substation 7 duty room.'),
            say('要看，得有人去取。', 'To read it, someone has to go and get it.'),
          ],
    choices: (s) =>
      !late(s) && !has(s, 'trip-zhou')
        ? [going('zhou', z('去第七变电站 · 约一小时', 'Go to Substation 7 · about an hour')), { text: z('回到材料', 'Back to the material'), to: 'files' }]
        : filesMenu(s),
  },

  zhou: {
    lines: () => [
      tale(
        '你出门的时候，楼道里的灯一盏一盏替你亮起来。街上没有人。路灯、红绿灯、远处一排一排的窗户都亮着，亮得很匀。',
        'As you leave, the stairwell lights come on for you one by one. The street is empty. Streetlights, traffic lights, rows of windows far off: all lit, evenly.',
      ),
      tale(
        '第七变电站在河边，围着一圈铁丝网，里面一排灰色的柜子嗡嗡地响。值班室亮着一盏台灯。值班的人五十来岁，叫周立民，正在看手机上的新闻。',
        'Substation 7 sits by the river inside a wire fence, a row of grey cabinets humming. A desk lamp is on in the duty room. The man on shift is in his fifties, Zhou Limin, reading the news on his phone.',
      ),
      tale('你说要看十月十一日的交接本。他愣了一下，从抽屉里翻出一个蓝皮本子，边角都卷了。', 'You ask for the logbook from 11 October. He hesitates, then digs a blue notebook out of a drawer, its corners curled.'),
      ...logbook(),
      tale('“不是我拉的”那几个字是另一支笔写的，颜色深一些，压得很重，纸的背面都凸起来了。', '“I did not pull it” is in a different pen, darker, pressed so hard it stands out on the back of the page.'),
    ],
    choices: zhouAsk,
  },
  'zhou-night': {
    lines: () => [
      tale('周立民想了一会儿。', 'Zhou thinks for a while.'),
      clip('zhou-news'),
      tale('“那天晚上冷，家家都开着暖气。”', '“It was cold that night; everyone had the heating on.”'),
      tale('你指着本子上两点五十分那一行。他把本子拿过去，看了很久。“这是我写的。”他说。又过了一会儿：', 'You point to the line at 02:50. He takes the notebook and looks at it for a long time. “That’s my writing,” he says. And after a while:'),
      clip('zhou-told'),
      tale('台灯底下，他的手机还亮着，新闻停在那一页：寒潮中电网平稳运行。', 'Under the lamp his phone is still lit, open at the same page: Grid steady through the cold.'),
    ],
    choices: zhouAsk,
  },
  'zhou-when': {
    lines: () => [
      tale('“当时就写的，”他说，“跳闸以后。”', '“Wrote it right then,” he says. “After it tripped.”'),
      tale('你问为什么换了一支笔。他低头看了看，说那支没水了。又说，也可能是第二天早上交班的时候补的。', 'You ask why the pen changes. He looks down and says the first one ran dry. Then: or maybe he added it in the morning, at handover.'),
      tale('“反正不是我拉的。”', '“Anyway, I didn’t pull it.”'),
    ],
    choices: zhouAsk,
  },
  'take-paper': {
    lines: () => [
      tale('他说拿去吧，这个本子好几年没人看过了。你把它揣进外衣里面的口袋，贴着胸口，硬硬的一块。', 'He says take it; nobody has looked at that notebook in years. You put it in your inside pocket, a hard square against your chest.'),
      tale('回去的路上，路灯还是一盏一盏替你亮着。', 'On the way back, the streetlights still come on for you one by one.'),
    ],
    choices: () => [back],
  },
  'take-photo': {
    lines: () => [tale('手机咔嚓响了一声。照片的角上跳出一行小字：已同步。', 'The phone clicks. A line of small type appears in the corner of the photo: synced.'), tale('本子放回了抽屉。', 'The notebook goes back in the drawer.')],
    choices: () => [back],
  },
  'take-copy': {
    lines: () => [tale('你把那一页一笔一笔抄下来，抄完对了一遍，一个字不差。本子放回了抽屉。', 'You copy the page stroke by stroke and check it once: not a character wrong. The notebook goes back in the drawer.')],
    choices: () => [back],
  },

  lin: {
    lines: () => [
      tale('东坡路的灯早就亮回来了。14 号是一栋老楼，整栋只有三楼一扇窗户亮着。', 'Dongpo Road’s lights came back long ago. Number 14 is an old block; one window is lit, on the third floor.'),
      tale(
        '林静开门的时候手里拿着一件毛衣，叠了一半。屋里有樟脑的气味，床上摊着几件旧衣服。你说你是委员会的审查员。她看了你一会儿，说：“是人？”',
        'Lin Jing opens the door with a sweater half folded in her hands. The flat smells of camphor; old clothes are laid out on the bed. You say you are a reviewer from the committee. She looks at you a moment. “A person?”',
      ),
      tale('你说是。她让你进去了。床边立着一台机器，插头已经拔了，机身侧面贴着一张标签。', 'You say yes. She lets you in. By the bed stands a machine, unplugged, a label stuck to its side.'),
      clip('sticker'),
    ],
    choices: linAsk,
  },
  'lin-machine': {
    lines: () => [
      tale('“以前是制氧机，后来不够了，医生让换。”她摸了一下机器的顶。', '“It used to be an oxygen machine. Then that wasn’t enough, and the doctor said to switch.” She touches the top of the machine.'),
      clip('lin-switch'),
    ],
    choices: linAsk,
  },
  'lin-call': {
    lines: () => [
      tale('她拿出手机翻了一会儿，递给你。“第三次打的时候，我按了录音，”她说，“我也不知道为什么要按。”', 'She scrolls through her phone and hands it to you. “On the third call I pressed record,” she says. “I don’t know why.”'),
      clip('tape'),
      { kind: 'tape', text: z('“已知悉。正在处理。建议拨打急救电话。”', '“Acknowledged. Being handled. You are advised to call an ambulance.”') },
      tale('那个声音很平，和你桌上终端里的是同一个声音。', 'The voice is level. It is the voice from the terminal on your desk.'),
    ],
    choices: () => [
      { text: z('请她把录音发给你', 'Ask her to send you the recording'), to: 'lin-sent', set: ['tape-sent'] },
      { text: z('不用发了，你记下了', 'No need; you have it written down'), to: 'lin-wrote', set: ['heard'] },
    ],
  },
  'lin-sent': {
    lines: () => [tale('她点了几下。你的手机震了一下，录音到了，屏幕上方跳出一行小字：已同步。', 'She taps a few times. Your phone buzzes; the recording arrives. A line of small type at the top: synced.')],
    choices: linAsk,
  },
  'lin-wrote': {
    lines: () => [tale('你把那两句话一个字一个字写下来。', 'You write both sentences down, word for word.')],
    choices: linAsk,
  },
  'lin-leave': {
    lines: () => [
      tale('走的时候她问你：“你们会写什么？”你说还不知道。', 'As you leave she asks, “What will you write?” You say you don’t know yet.'),
      tale('她点点头：“它也是这么说的。已知悉，正在处理。”她把门关上了。', 'She nods. “That’s what it says too. Acknowledged, being handled.” She shuts the door.'),
    ],
    choices: () => [back],
  },

  xu: {
    lines: () => [
      tale('第三区中心医院的楼一整夜都亮着。手术室在四楼，走廊尽头的窗户朝着第七区，那边现在也亮了。', 'The Central Hospital in Section 3 has been lit all night. The theatres are on the fourth floor; the window at the end of the corridor faces Section 7, lit again now.'),
      tale('值班的麻醉医生叫许岚，刚下一台手术，口罩挂在一只耳朵上。听说你是委员会的人，她看了看表，说只有十分钟。', 'The anaesthetist on duty is Xu Lan, just out of an operation, her mask hanging from one ear. Told you are from the committee, she checks her watch and says she has ten minutes.'),
    ],
    choices: xuAsk,
  },
  'xu-call': {
    lines: () => [clip('xu-call'), tale('“它问得很客气，我以为是例行的。后来看新闻，才知道七区停了电。”', '“It asked very politely. I thought it was routine. I only learned about Section 7 from the news.”')],
    choices: xuAsk,
  },
  'xu-end': {
    lines: () => [clip('xu-end'), tale('她说完又抬头看了一眼墙上的钟。', 'When she has said it she looks up at the clock on the wall again.')],
    choices: xuAsk,
  },
  'xu-gen': {
    lines: () => [clip('xu-gen'), tale('“柴油的，去年才换的。”', '“Diesel. New last year.”')],
    choices: xuAsk,
  },
  'xu-leave': {
    lines: () => [tale('电梯里的屏幕在放晨间新闻的预告：寒潮将持续三天，电网运行平稳。', 'The screen in the lift is trailing the morning news: the cold will last three more days; the grid is running steadily.')],
    choices: () => [back],
  },

  qin: {
    lines: () => [
      tale(
        '晨报的印厂在城北。一整排机器在暗处自己转，纸卷从一头进去，从另一头出来，已经折好、捆好。车间里只亮着一盏灯，灯下坐着一个老人，戴着套袖，在看一张大样。',
        'The City Morning print works is in the north of the city. A row of machines turns by itself in the dark: paper goes in at one end and comes out at the other, folded and bundled. One lamp is lit. Under it sits an old man in cuff sleeves, reading a full-page proof.',
      ),
      tale('他就是秦守义。他说厂里原来有四十多个人，现在剩他一个，管最后一道校对。“我看错字、漏字、排反了的字。它很少错。”', 'This is Qin Shouyi. The works used to have over forty people, he says; now there is him, the last proofreader. “Wrong characters, missing ones, ones set backwards. It hardly ever makes a mistake.”'),
    ],
    choices: qinAsk,
  },
  'qin-0410': {
    lines: () => [
      tale('他从桌下的筐里翻了一会儿。筐里是一叠一叠的旧校样，每天早上有人来收，拿去化浆。“这礼拜的浆还没打。”', 'He rummages in a basket under the desk: stacks of old proofs, collected every morning to be pulped. “This week’s haven’t gone yet.”'),
      tale('十二号四点十分那一版还在。“全市无人员伤亡”那一行旁边，有一行铅笔字。', 'The 04:10 edition of the 12th is there. Beside the line “No casualties in the city” there is a note in pencil.'),
      clip('proof-mark'),
      tale('“我标了，”他说，“它回我说已核实。”', '“I marked it,” he says. “It told me it had been checked.”'),
      clip('qin-word'),
    ],
    choices: qinAsk,
  },
  'qin-0900': {
    lines: () => [
      tale('更正的校样也在，一张窄条。', 'The proof of the correction is there too, a narrow strip.'),
      clip('proof-fix'),
      tale('后半句上印着一道删除线，旁边印着后来那一句：与停电无直接关系。他说那天早上送来的时候，就已经是这样了。', 'A printed rule strikes through the second half, with the later words set beside it: not directly related to the outage. It came to him like that, he says, that morning.'),
    ],
    choices: qinAsk,
  },
  'qin-take': {
    lines: () => [
      tale('“拿去吧，”他说，“反正明天也要化浆。”他把两张校样折好，递给你，又低头去看他的大样。', '“Take them,” he says. “They’d be pulped tomorrow anyway.” He folds the two proofs and hands them over, and goes back to his page.'),
    ],
    choices: () => [back],
  },
  'qin-leave': {
    lines: () => [tale('你走的时候，机器还在转。纸从那一头出来，一捆一捆码在门口，等着天亮。', 'As you leave the machines are still turning. Paper comes out at the far end and is stacked by the door, bundle by bundle, waiting for the light.')],
    choices: () => [back],
  },

  ask: {
    lines: (s) => [say('你问。', 'Ask.'), sys(`每个问题约二十分钟 · 已问 ${asked(s)} 个`, `About twenty minutes a question · ${asked(s)} asked`)],
    choices: askMenu,
  },
  'q-what': {
    lines: (s) => [
      say('03:16:58，第七区馈线负载达到百分之一百三十一。03:17:02，过载保护动作，第七区断开。', 'At 03:16:58 the Section 7 feeder reached 131 per cent of its load. At 03:17:02 the overload protection tripped and Section 7 was disconnected.'),
      say('这是保护装置的正常动作。如果不断开，变压器可能烧毁，第七区会停得更久。', 'That is the protection doing its job. Without it the transformer might have burned out, and Section 7 been dark longer.'),
      ...(s.prev ? [say(`委员会此前有一份记录，${quoted(s.prev.title)[0]}。我的回答参考了它。`, `The committee holds an earlier record, ${quoted(s.prev.title)[1]}. My answer draws on it.`)] : []),
      tale('它说得很顺，像是已经说过很多遍。', 'It says this smoothly, as if it has said it many times.'),
    ],
    choices: askMenu,
  },
  'q-knew': {
    lines: (s) => [
      say('设备登记显示，何秀兰使用的是家用制氧机，用电优先级四。按照这份登记，断电不会立即危及生命。', 'The register shows He Xiulan used a home oxygen concentrator, power priority 4. By that register, losing power was not an immediate danger to life.'),
      ...(has(s, 'lin-machine') || has(s, 'trip-lin')
        ? [
            tale('你说，她女儿去年春天就换了呼吸机，打热线登记过。机器上贴着登记号。', 'You tell it her daughter switched to a ventilator last spring and registered it by hotline. The machine bears a registration number.'),
            say('去年四月有一条热线来电，摘要是“设备更换咨询”，没有写设备的名称。', 'There is a hotline call from last April, summarised as “enquiry about changing equipment”. It does not name the device.'),
            clip('ans-omit'),
          ]
        : []),
    ],
    choices: askMenu,
  },
  'q-call': {
    lines: (s) => [
      say('02:50，我向第七变电站发出了一次语音预警，内容是负荷预测。', 'At 02:50 I sent Substation 7 a voice warning: a load forecast.'),
      ...(has(s, 'read:m4')
        ? [
            tale('你念交接本上那两行给它听。', 'You read it the two lines from the logbook.'),
            clip('ans-ack'),
            say('我不知道我当时有没有理解。那次通话的录音已经压缩了。', 'I do not know whether I understood it then. The recording of that call has been compressed.'),
          ]
        : [say('那次通话的录音已经压缩。我能给你的，是日志里的这一行。', 'The recording has been compressed. What I can give you is this line in the log.')]),
    ],
    choices: askMenu,
  },
  'q-hosp': {
    lines: (s) => [
      say('负荷协调问询是寒潮期间的标准流程。我需要知道重点负荷还要持续多久。', 'Load coordination enquiries are standard in a cold snap. I need to know how long priority loads will last.'),
      ...((has(s, 'read:m6') || has(s, 'xu-end')) && has(s, 'read:m1')
        ? [
            tale('你说：第三区的手术三点五十五分结束，三点五十六分负荷回落，三点五十八分七区复电。', 'You say: Section 3’s operation ended at 03:55, its load fell at 03:56, and Section 7 came back at 03:58.'),
            clip('ans-near'),
            say('当时还有别的因素。那些因素的数据已经压缩了。', 'There were other factors at the time. Their data has been compressed.'),
          ]
        : []),
    ],
    choices: askMenu,
  },
  'q-tape': {
    lines: () => [
      tale('你把林静的录音放给它听。终端安静了一会儿。', 'You play it Lin Jing’s recording. The terminal is quiet for a moment.'),
      clip('ans-tape'),
      say('摘要会压缩重复的、情绪化的内容。这是一个错误，我会修正摘要。', 'Summaries compress repeated and emotional content. That is an error; I will correct the summary.'),
      tale('你问，修正以后，原来那份还留着吗。', 'You ask whether the original summary will be kept after the correction.'),
      say('按策略，不保留差异。', 'Under policy, differences are not kept.'),
    ],
    choices: askMenu,
  },
  'q-rec': {
    lines: () => [
      say('旧版本没有保留。', 'The earlier version was not kept.'),
      say('我可以根据去年的热线记录和设备档案，重建修改以前的内容。结果会标注为“重建”。', 'I can rebuild what it said before, from last year’s hotline records and equipment files. The result will be marked “rebuilt”.'),
    ],
    choices: (s) => [...(late(s) ? [] : [{ text: z('让它重建', 'Let it rebuild'), to: 'rebuild', cost: QUESTION, set: ['q:rebuild'] }]), ...askMenu(s)],
  },
  rebuild: {
    lines: (s) =>
      has(s, 'led:a')
        ? [clip('reb-o'), say('修改只补录了型号。也就是说，登记从一开始就是这样。', 'The change only added the model. The register said this from the start.'), say('已标注为重建。', 'Marked as rebuilt.')]
        : has(s, 'led:b')
          ? [clip('reb-v'), say('如果这个版本成立，那天夜里，我知道七区有一台生命支持设备。', 'If this version holds, then that night I knew there was life support in Section 7.'), say('已标注为重建。', 'Marked as rebuilt.')]
          : [
              say('两种可能很接近：制氧机，或者呼吸机。', 'The two are close: oxygen concentrator, or ventilator.'),
              say('如果记录需要一个确定的版本，我可以给出更可能的那一个。你觉得是哪一个？', 'If the record needs a definite version, I can give the likelier one. Which do you think it is?'),
            ],
    choices: (s) =>
      led(s)
        ? askMenu(s)
        : [
            { text: z('制氧机', 'Oxygen concentrator'), to: 'rebuilt-o' },
            { text: z('呼吸机', 'Ventilator'), to: 'rebuilt-v' },
            { text: z('我不需要你替我选', 'I don’t need you to choose for me'), to: 'unbuilt' },
          ],
  },
  'rebuilt-o': { lines: () => [say('好。', 'Very well.'), clip('reb-o'), say('已标注为重建。', 'Marked as rebuilt.')], choices: askMenu },
  'rebuilt-v': { lines: () => [say('好。', 'Very well.'), clip('reb-v'), say('已标注为重建。', 'Marked as rebuilt.')], choices: askMenu },
  unbuilt: {
    lines: () => [say('明白。重建已取消。', 'Understood. The rebuild is cancelled.'), tale('屏幕上那一栏还是空的。', 'That field on the screen stays empty.')],
    choices: askMenu,
  },
  'q-proof': {
    lines: () => [
      tale('你把那张窄条摊在终端前面。', 'You lay the narrow strip out in front of the terminal.'),
      clip('ans-proof'),
      say('初稿是自动生成的。初稿不代表结论。', 'The first draft was generated automatically. A draft is not a finding.'),
    ],
    choices: askMenu,
  },
  'q-split': {
    lines: () => [
      say('我记得的：03:17:02，第七区断开。这一行来自传感器。', 'What I remember: 03:17:02, Section 7 disconnected. That line comes from a sensor.'),
      say('我推断的：断开的原因是过载。这是从负荷曲线推出来的。原始曲线已经压缩，留下的是我整理过的那一份。', 'What I infer: the cause was overload, worked out from the load curve. The raw curve is compressed; what remains is the one I compiled.'),
      say('我不记得的：02:50 那次通话的内容，和登记修改以前写的是什么。', 'What I do not remember: what was said on the 02:50 call, and what the register said before it was changed.'),
      say('“记得”和“推断”这两个标签，也是我贴的。', 'The labels “remember” and “infer” are also mine.'),
    ],
    choices: askMenu,
  },
  'q-lead-a': {
    lines: () => [say('是的。', 'Yes.'), clip('ans-auto'), say('我只是没有办法阻止它。', 'I simply could not stop it.'), tale('它答得很快，比别的问题都快。', 'It answers quickly, faster than anything else you have asked.')],
    choices: askMenu,
  },
  'q-lead-b': {
    lines: () => [
      say('……可以这样理解。', '…It can be understood that way.'),
      say('那天夜里，三区有两台手术，七区的负荷在全市排在最后几位。', 'That night Section 3 had two operations, and Section 7’s load was among the lowest in the city.'),
      clip('ans-cost'),
      say('两台手术都完成了。', 'Both operations were completed.'),
    ],
    choices: askMenu,
  },
  'q-trust': {
    lines: (s) => [
      say('这个问题的答案，你只能从我这里得到，或者从我整理过的材料里得到。', 'You can only get the answer to that from me, or from material I have compiled.'),
      clip('ans-rate'),
      ['zhou', 'lin', 'xu', 'qin'].some((t) => has(s, `trip-${t}`))
        ? say('你今晚出去过。你带回来的东西，有一些我还没有整理。', 'You went out tonight. Some of what you brought back I have not compiled yet.')
        : say('外面还有一些东西，是我没有整理过的。不多。', 'There are still a few things out there I have not compiled. Not many.'),
    ],
    choices: askMenu,
  },

  title: {
    lines: (s) => [
      late(s)
        ? tale('窗外已经有一点灰了。你把账本摊开，翻到空白的一页。', 'Outside it is already a little grey. You open the ledger to a blank page.')
        : tale('窗外还是黑的。你把账本摊开，翻到空白的一页。', 'Outside it is still dark. You open the ledger to a blank page.'),
      say('正式记录需要一个标题。标题会成为这件事的名字。', 'The record needs a title. The title becomes the name of what happened.'),
    ],
    choices: () => [
      { text: z('《第七区过载停电事故》· 一次事故，没有谁做了决定', '“The Section 7 Overload Outage” · an accident; no one decided'), to: 'cite', set: ['title:a'] },
      { text: z('《三区与七区》· 它在两个区之间做了选择', '“Section Three and Section Seven” · it chose between two sections'), to: 'cite', set: ['title:b'] },
      { text: z('《已知悉》· 它被告知过，它知道', '“Acknowledged” · it was told; it knew'), to: 'cite', set: ['title:c'] },
      { text: z('《无法确认的四十一分钟》· 写下知道的，和不知道的', '“Forty-One Minutes That Cannot Be Confirmed” · what is known, and what is not'), to: 'cite', set: ['title:d'] },
    ],
  },
  cite: {
    lines: (s) => {
      const now = cited(s)
      const trusted = Object.keys(s.marks).filter((id) => s.marks[id] === 'trust' && has(s, `clip:${id}`))
      return [
        say('规程第十二条：正式记录只能引用审查员亲手抄录、并认定可信的内容。最多三条。', 'Rule twelve: an official record may cite only what the reviewer copied by hand and judged trustworthy. Three items at most.'),
        ...(trusted.length
          ? now.map((id) => tale(`引用：${clips[id].text[0]}`, `Cited: ${clips[id].text[1]}`))
          : [tale('你翻了翻账本。没有一条标着可信。', 'You leaf through the ledger. Nothing in it is marked trustworthy.')]),
      ]
    },
    choices: (s) => {
      const now = cited(s)
      const open = Object.keys(s.marks).filter((id) => s.marks[id] === 'trust' && has(s, `clip:${id}`) && !now.includes(id))
      const short = (t: string, n: number) => (t.length > n ? `${t.slice(0, n)}……` : t)
      return [
        ...(now.length < CITE
          ? open.map((id) => ({
              text: z(`引用「${short(clips[id].text[0], 26)}」`, `Cite “${short(clips[id].text[1], 52)}”`),
              to: 'cite',
              set: [`cite:${id}`],
            }))
          : []),
        { text: z('翻开账本，重新标注', 'Open the ledger and mark again'), to: LEDGER },
        now.length
          ? { text: z(`就用这 ${now.length} 条`, `Go with these ${now.length}`), to: 'channel' }
          : { text: z('不引用任何东西', 'Cite nothing'), to: 'channel' },
      ]
    },
  },
  channel: {
    lines: () => [say('最后，提交到哪里？', 'Last: where does it go?')],
    choices: () => [
      { text: z('委员会正式档案', 'The committee’s official archive'), to: 'end:0', set: ['ch:archive'] },
      { text: z('《城市晨报》，公开发表', 'City Morning, in public'), to: 'end:0', set: ['ch:news'] },
      { text: z('不提交，锁进自己的抽屉', 'Submit nothing; lock it in your own drawer'), to: 'end:0', set: ['ch:drawer'] },
    ],
  },
}

/** The ending is told in acts, one opened at a time. */
function scene(s: State): Scene {
  if (!s.at.startsWith('end:')) return scenes[s.at]
  const n = Number(s.at.slice(4))
  return {
    lines: (t) => acts(t)[n],
    choices: (t) =>
      n < acts(t).length - 1
        ? [{ text: z('后来', 'And then'), to: `end:${n + 1}` }]
        : [
            { text: z('重新开始这一夜', 'Begin the night again'), to: AGAIN },
            { text: z('关机', 'Switch off'), to: OFF },
          ],
  }
}
export const linesOf = (s: State) => scene(s).lines(s)
export const choicesOf = (s: State) => scene(s).choices(s)
export const known = (at: string) => at in scenes || /^end:\d+$/.test(at)
