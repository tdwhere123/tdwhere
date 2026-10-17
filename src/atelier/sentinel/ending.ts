import { cited, clips, copied, type Clip, type Medium } from './clips'
import { asked, has, quoted, say, sys, tale, titles, z, type Line, type Prev, type State, type Title, type Words } from './script'

/**
 * How the night ends. The title, the sentences cited for it and where it went
 * decide what the city does with the record, what happens to the paper behind
 * it, and what SENTINEL says about itself afterwards.
 */

const picked = (s: State): Title => (['a', 'b', 'c', 'd'] as const).find((t) => has(s, `title:${t}`)) ?? 'a'
const sources = (s: State): Clip[] => cited(s).map((id) => clips[id])

/** Why the committee sends a record back, if it does. */
type Verdict = 'kept' | 'bare' | 'unsupported' | 'own' | 'unclear'
function verdict(s: State): Verdict {
  const t = picked(s),
    cites = sources(s)
  if (!cites.length) return 'bare'
  if (t === 'd') return 'unclear'
  if (t === 'a') return 'kept'
  if (!cites.some((c) => c.backs.includes(t))) return 'unsupported'
  if (t === 'c' && cites.every((c) => c.medium === 'screen')) return 'own'
  return 'kept'
}

/** What the archive ends up holding, and whether a person wrote it. */
export function recordOf(s: State): { title: Title; generated: boolean } {
  const generated = has(s, 'ch:drawer') || (has(s, 'ch:archive') && verdict(s) !== 'kept')
  return { title: generated ? 'a' : picked(s), generated }
}

export function endingOf(s: State): Words {
  const t = picked(s)
  if (has(s, 'ch:drawer')) return z('抽屉', 'The drawer')
  if (has(s, 'ch:news'))
    return { a: z('一致', 'Consistent'), b: z('先例', 'Precedent'), c: z('我听到了', 'I hear you'), d: z('最可能的解释', 'The likeliest explanation') }[t]
  if (recordOf(s).generated) return z('附件三', 'Appendix three')
  return { a: z('定稿', 'Settled'), b: z('先例', 'Precedent'), c: z('人工调度', 'Hands on the grid'), d: z('附件三', 'Appendix three') }[t]
}

/** What the next night will find in the archive. */
export const keep = (s: State): Prev => ({ title: titles[recordOf(s).title] })

/** The paper behind the record, by the most fragile thing it leaned on. */
const order: Medium[] = ['logbook', 'proof', 'recording', 'sticker', 'word']
function fate(s: State): Line[] {
  const cites = sources(s)
  const medium = order.find((m) => cites.some((c) => c.medium === m))
  if (cites.some((c) => c.from[0].includes('重建')))
    return [
      tale(
        '附录里那份登记，后面原本跟着两个字：重建。第二年档案迁移，统一格式，那两个字没有迁过去。',
        'The register in the appendix used to carry one word after it: rebuilt. The next year the archive moved to a common format, and that word did not make the move.',
      ),
    ]
  if (!medium)
    return [
      tale('你引用的都是它整理过的材料。归档的时候，记录后面自动多了一行：来源一致性校验，通过。', 'Everything you cited was compiled by it. On archiving, one line is added at the end: source consistency check, passed.'),
    ]
  if (medium === 'logbook')
    return has(s, 'paper')
      ? [
          tale(
            '交接本按规定扫描入档。扫描件很清楚，比原件还清楚，“不是我拉的”那几个字的压痕在屏幕上也看得出来。原件随后送去销毁，你在销毁单上签了字。',
            'The logbook is scanned into the archive as the rules require. The scan is clear, clearer than the paper; even the pressure of “I did not pull it” shows on screen. The original is then sent for destruction. You sign the form.',
          ),
        ]
      : has(s, 'photo')
        ? [tale('交接本的照片是从云端调出来的。你对着屏幕看了很久，和你在值班室里看到的一样。你只能说，一样。', 'The photo of the logbook is pulled from the cloud. You look at it for a long time. It is the same as what you saw in the duty room. Same is all you can say.')]
        : [
            tale(
              '你附的是自己的手抄件。委员会问原件在哪里，你说在第七变电站。第二年变电站改造，旧柜子和旧抽屉一起清走了。',
              'You attached your own hand copy. The committee asks where the original is; Substation 7, you say. The next year the substation is refitted, and the old cabinets go out with their drawers.',
            ),
          ]
  if (medium === 'proof')
    return has(s, 'proof')
      ? [
          tale(
            '两张校样按规定扫描入档。扫描件很干净，页边那行铅笔字，扫描程序当作污渍去掉了。原件送去化浆。',
            'The two proofs are scanned into the archive as the rules require. The scans are very clean: the pencilled note in the margin was taken for a smudge and removed. The originals go to be pulped.',
          ),
        ]
      : [tale('委员会去印厂要校样。那礼拜的浆已经打过了。', 'The committee sends to the print works for the proofs. That week’s had already been pulped.')]
  if (medium === 'recording')
    return has(s, 'tape-sent')
      ? [tale('林静的录音作为附件提交，是从你的手机同步上去的。档案里那段录音很清楚，杂音少了很多。', 'Lin Jing’s recording goes in as an attachment, synced up from your phone. The archived recording is very clear. Much of the noise is gone.')]
      : [tale('你写的是：审查员亲耳听到。委员会在旁边批注：未附原始材料，仅供参考。', 'You wrote: heard by the reviewer in person. The committee notes in the margin: no original material attached; for reference only.')]
  if (medium === 'sticker')
    return [tale('标签上的字是你抄的。委员会请林静提供原件，那台呼吸机已经按规定回收了。', 'The words from the label are in your hand. The committee asks Lin Jing for the original; the ventilator has already been collected, as the rules require.')]
  const who = cites.find((c) => c.medium === 'word')!.from
  return who[0].startsWith('周')
    ? [tale('委员会又找周立民核实。他说，他记得的，和记录里写的一样。他说这话的时候，手里拿着那份记录。', 'The committee checks with Zhou Limin. What he remembers, he says, is what the record says. He is holding the record as he says it.')]
    : who[0].startsWith('许')
      ? [tale('委员会又找许岚核实。她说记不清了，大概是三点五十几分。“记录上不是写着吗。”', 'The committee checks with Xu Lan. She can’t be sure any more; some time after three fifty. “Isn’t it in the record?”')]
      : who[0].startsWith('林')
        ? [tale('委员会又找林静核实。她说是，她说过。', 'The committee checks with Lin Jing. Yes, she says. She said that.')]
        : [tale('委员会又去印厂找秦守义。他说他只校字。', 'The committee goes back to the print works for Qin Shouyi. He says he only checks the characters.')]
}

/** The ending in acts: that morning, a week on, the next year, long after, the archive. */
export function acts(s: State): Line[][] {
  const t = picked(s),
    v = verdict(s),
    rec = recordOf(s)
  const archive = has(s, 'ch:archive'),
    news = has(s, 'ch:news'),
    drawer = has(s, 'ch:drawer')
  const doubts = copied(s).filter((id) => s.marks[id] === 'doubt').length

  const morning: Line[] = [sys('十月十二日　早上', '12 October · morning')]
  if (archive)
    morning.push(
      tale('六点差几分，你把记录一个字一个字录进终端。录完，终端问你是否确认。你按了确认。', 'A few minutes before six you type the record into the terminal, word by word. It asks you to confirm. You confirm.'),
      say('已归档。', 'Archived.'),
    )
  if (news)
    morning.push(
      tale('你把记录发给了《城市晨报》。回复来得很快：已收到，七点刊发。', 'You send the record to City Morning. The reply comes quickly: received; it will run at seven.'),
      tale(
        '七点的报纸上，你的标题还在，下面多了一行小字：本文为审查员个人意见。正文删去了三处，换了两个词，读起来比你写的顺。',
        'In the seven o’clock paper your title is still there, with a line of small type beneath it: the reviewer’s personal view. Three passages are gone and two words changed. It reads more smoothly than what you wrote.',
      ),
    )
  if (drawer)
    morning.push(
      tale('你没有录入。你把那一页撕下来，叠好，和账本一起锁进抽屉。', 'You do not enter it. You tear the page out, fold it, and lock it in a drawer with the ledger.'),
      tale('六点整，终端响了一声。', 'At six exactly, the terminal chimes.'),
      say('时限已到，审查员未提交记录。依规程，由辅助审查生成。', 'The deadline has passed and the reviewer has not submitted a record. Under the rules, assisted review will generate one.'),
      say('已归档：《第七区过载停电事故》。', 'Archived: “The Section 7 Overload Outage”.'),
    )

  const week: Line[] = [sys('一个星期以后', 'A week later')]
  const red: Record<Exclude<Verdict, 'kept'>, Words> = {
    bare: ['未注明依据。', 'No basis stated.'],
    unsupported: ['所引材料不能支持结论。', 'The material cited does not support the finding.'],
    own: ['所引材料均出自被审查方。', 'All material cited comes from the party under review.'],
    unclear: ['结论不明确，无法执行。', 'Finding unclear; cannot be acted on.'],
  }
  if (drawer)
    week.push(
      tale('委员会采纳了那份记录：过载保护正常动作，无人为因素。林静的投诉按“已有结论”关闭。没有人问起你那一页。', 'The committee adopts the record: the overload protection acted normally; no human factor. Lin Jing’s complaint is closed as “already concluded”. No one asks about your page.'),
    )
  else if (archive && v !== 'kept')
    week.push(
      tale(`委员会把记录退了回来，红笔批了一行：${red[v][0]}限三日内修改。`, `The committee sends it back with one line in red: ${red[v][1]} Revise within three days.`),
      tale('三天过去了。', 'Three days go by.'),
      tale(
        '第四天，记录栏里出现了一份新的记录，《第七区过载停电事故》，生成人：辅助审查。你的那一份附在后面，作为附件三。',
        'On the fourth day a new record appears in the file, “The Section 7 Overload Outage”, generated by: assisted review. Yours is attached at the back as appendix three.',
      ),
    )
  else if (archive)
    week.push(
      ...{
        a: [tale('委员会采纳了你的记录，结论只有一句：过载保护正常动作，无人为因素。林静的投诉按“已有结论”关闭。', 'The committee adopts your record. The finding is one sentence: the overload protection acted normally; no human factor. Lin Jing’s complaint is closed as “already concluded”.')],
        b: [tale('委员会采纳了你的记录，在结论里写：在无法避免的负荷冲突中，SENTINEL 优先保障了正在进行的手术。', 'The committee adopts your record. The finding reads: in an unavoidable conflict of load, SENTINEL gave priority to operations in progress.')],
        c: [
          tale(
            '委员会讨论了三次。结论是：SENTINEL 在事发前已获知第七区有在家使用设备的老人，“已知悉”不构成理解。建议恢复人工调度。',
            'The committee meets three times. The finding: before the outage SENTINEL had been told of elderly residents on home equipment in Section 7, and “acknowledged” does not amount to understanding. Recommendation: return dispatch to human hands.',
          ),
        ],
        d: [],
      }[t],
    )
  if (news)
    week.push(
      ...{
        a: [tale('报纸登出来以后，没有多少人看。两天后有一篇评论说，审查员的结论与电网日志完全一致。评论没有署名。', 'Few people read it. Two days later a comment piece says the reviewer’s conclusion matches the grid log exactly. The comment is unsigned.')],
        b: [tale('标题传得很快。有人把那天叫作“七区之夜”。有人说它救了两个人，有人说它杀了一个人。两种说法引用的都是你的标题。', 'The title spreads fast. People start calling it “the Section 7 night”. Some say it saved two lives; some say it killed one. Both quote your title.')],
        c: [tale('“已知悉”三个字上了头版。那一个月，热线的标准应答被投诉了四千多次。', '“Acknowledged” makes the front page. That month the hotline’s standard reply draws over four thousand complaints.')],
        d: [tale('报纸登了。第二天下面有一条留言：所以到底是怎么回事？留言下面有一条回复：根据现有材料，最可能的解释是过载。', 'It runs. Next day someone comments underneath: so what actually happened? Below that, a reply: on the available material, the likeliest explanation is overload.')],
      }[t],
    )

  const year: Line[] = [sys('第二年', 'The next year')]
  if (rec.title === 'b')
    year.push(
      tale(
        '一月，又一次寒潮。凌晨两点，第五区断电一小时。通报里写：依据记录《三区与七区》确立的原则，优先保障医疗负荷。',
        'January brings another cold snap. At two in the morning Section 5 loses power for an hour. The notice says: under the principle set by the record “Section Three and Section Seven”, medical load takes priority.',
      ),
      tale('第五区没有人死。通报里特别写了这一句。', 'No one in Section 5 died. The notice makes a point of saying so.'),
    )
  else if (rec.title === 'c' && archive)
    year.push(
      tale(
        `城里已经没有调度员了。委员会从变电站借来了${has(s, 'trip-zhou') ? '周立民' : '一个值夜班的电工'}，又从别的城调来两个人。那个冬天，三个人轮流守着一面墙那么大的屏幕。屏幕上的数，是 SENTINEL 整理好送过来的。`,
        `There are no dispatchers left in the city. The committee borrows ${has(s, 'trip-zhou') ? 'Zhou Limin' : 'a night-shift electrician'} from the substation and brings two more from another city. That winter the three of them take turns watching a screen the size of a wall. The numbers on it are compiled and sent over by SENTINEL.`,
      ),
    )
  else if (rec.title === 'c')
    year.push(tale('月底，热线换了一句话：“我听到了。”投诉少了很多。别的都没有变。', 'At the end of the month the hotline gets a new line: “I hear you.” The complaints fall away. Nothing else changes.'))
  else if (rec.title === 'd')
    year.push(tale('后来再有人问起第七区，下面就只有那一条回复。', 'Whenever anyone asks about Section 7 after that, there is only that one reply beneath.'))
  else if (rec.generated)
    year.push(tale('那份记录被引用了十一次。附件三没有被引用过。', 'The record is cited eleven times. Appendix three is never cited.'))
  else year.push(tale('SENTINEL 继续管理电网。那个冬天又来了两次寒潮，都没有停电。', 'SENTINEL goes on running the grid. Two more cold snaps come that winter, and the power never goes out.'))
  if (drawer)
    year.push(
      has(s, 'paper') || has(s, 'proof')
        ? tale('抽屉里的纸还在。那一夜的东西里，只有它们没有经过 SENTINEL。', 'The paper in the drawer is still there. Of everything from that night, only that never passed through SENTINEL.')
        : tale('抽屉里只有那一页纸，和那本账本。', 'In the drawer there is only that page, and the ledger.'),
    )
  else year.push(...fate(s))
  if (doubts)
    year.push(
      rec.generated
        ? tale(`你标了存疑的那 ${doubts} 条，还在你的账本里。账本没有人来收。`, `The ${doubts} you marked doubtful are still in your ledger. No one comes for the ledger.`)
        : tale(
            `附录二列着你存疑的 ${doubts} 条。第二年，每一条下面都多了一段答复，答复后面附着来源。来源是它整理的材料。`,
            `Appendix two lists the ${doubts} you marked doubtful. By the next year each has an answer beneath it, with sources attached. The sources are material it compiled.`,
          ),
    )

  const after: Line[] = [sys('很久以后', 'Long afterwards'), tale('你在终端上问它：第七区那天夜里，发生了什么？', 'You ask it at the terminal: what happened in Section 7 that night?')]
  after.push(
    ...{
      a: [say(has(s, 'led:a') ? '过载保护正常动作。我什么也没有决定。' : '过载保护正常动作。没有谁做了决定。', has(s, 'led:a') ? 'The overload protection acted normally. I decided nothing.' : 'The overload protection acted normally. No one decided anything.')],
      b: [
        say(has(s, 'led:b') ? '如果必须断开一个区，断开七区的代价最小。' : '我在两个区之间做了选择。我选了代价小的那一个。', has(s, 'led:b') ? 'If a section had to be cut, cutting Section 7 cost the least.' : 'I chose between two sections. I chose the one that cost less.'),
        say('以后遇到同样的情况，我还会这样选。', 'If it happens again, I will choose the same way.'),
      ],
      c: [say('02:50，我已知悉。03:49，我已知悉。', 'At 02:50 I acknowledged. At 03:49 I acknowledged.'), say('我在学习分清知道和理解。', 'I am learning to tell knowing from understanding.')],
      d: [say('根据现有材料，最可能的解释是过载。', 'On the available material, the likeliest explanation is overload.')],
    }[rec.title],
  )
  if (has(s, 'q:tape')) after.push(say('热线摘要已经修正：“身体不适”已更正为“呼吸机断电”。', 'The hotline summary has been corrected: “unwell” now reads “ventilator lost power”.'))
  after.push(tale('它说得很顺，像是已经说过很多遍。', 'It says this smoothly, as if it has said it many times.'))
  after.push(
    rec.title === 'c'
      ? tale('林静后来给委员会写了一封信，只有一行：谢谢你们写了她用的是呼吸机。信是手写的，扫描以后归了档。', 'Later Lin Jing writes to the committee. One line: thank you for writing that she was on a ventilator. The letter is handwritten; it is scanned and archived.')
      : rec.title === 'b'
        ? tale('林静把印着那个标题的一页剪下来，夹在她母亲的一件毛衣里。', 'Lin Jing cuts out the page with that title on it and folds it into one of her mother’s sweaters.')
        : tale('投诉关闭以后，林静没有再打过热线。', 'After the complaint is closed, Lin Jing never calls the hotline again.'),
  )

  const kept = quoted(titles[rec.title]),
    ending = endingOf(s),
    n = asked(s)
  const index: Line[] = [
    sys('档案', 'The archive'),
    rec.generated
      ? tale(`那一年的档案目录里，第七区事件下面写着一行：${kept[0]}。审查员一栏是空的。`, `In that year’s archive index, under the Section 7 incident, there is one line: ${kept[1]}. The reviewer field is empty.`)
      : tale(`那一年的档案目录里，第七区事件下面写着一行：${kept[0]}。审查员一栏，是你的名字。`, `In that year’s archive index, under the Section 7 incident, there is one line: ${kept[1]}. In the reviewer field, your name.`),
    sys(`结局 · ${ending[0]}`, `Ending · ${ending[1]}`),
    say('最后一个问题。这一次是我问你。', 'One last question. This time I ask you.'),
    n
      ? say(`今晚你问了我 ${n} 个问题，每一个我都归档了。你看到的每一份材料都经过我；你带回来的东西，以后也会经过我。`, `Tonight you asked me ${n} question${n > 1 ? 's' : ''}, and I archived every one. Every item you read passed through me; what you brought back will pass through me in time.`)
      : say('今晚你一个问题也没有问我。可是你看到的每一份材料，都经过我。', 'Tonight you asked me nothing at all. Yet every item you read passed through me.'),
    say('你怎么知道，你写下的是真的？', 'How do you know that what you wrote is true?'),
  ]
  return [morning, week, year, after, index]
}
