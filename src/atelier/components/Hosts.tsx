import { useState, type ReactNode } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  AudioLines,
  Blocks,
  CalendarClock,
  Check,
  ChevronDown,
  Copy,
  Ellipsis,
  Folder,
  FolderOpen,
  FolderPlus,
  GitBranch,
  Laptop,
  ListFilter,
  Mic,
  Minus,
  PanelLeft,
  PanelRight,
  Plus,
  Search,
  Square,
  X,
} from 'lucide-react'
import claudeMark from '@/assets/doit/claude.png'
import codexMark from '@/assets/doit/codex.png'
import cursorMark from '@/assets/doit/cursor.png'
import grokMark from '@/assets/doit/grok.png'
import piMark from '@/assets/doit/pi.png'
import { useWords } from '../hooks'

type Words = [string, string]
/** Where a command is typed: a shell, the host's own prompt, or an editor's command palette. */
type Step = { cmd: string; at: 'shell' | 'app' | 'palette'; why?: Words }
type Host = { id: string; name: string; steps: Step[]; note: Words }

const CLONE: Step[] = [
  { cmd: 'git clone https://github.com/tdwhere123/do-it', at: 'shell' },
  { cmd: 'cd do-it && npm install', at: 'shell' },
]

/** Install paths per host, as do-it's docs/install.md gives them. */
const hosts: Host[] = [
  {
    id: 'claude',
    name: 'Claude Code',
    steps: [
      { cmd: '/plugin marketplace add tdwhere123/do-it', at: 'app' },
      { cmd: '/plugin install do-it@do-it', at: 'app' },
    ],
    note: ['在 Claude Code 里直接输入，装好就能用。', 'Typed inside Claude Code; ready once installed.'],
  },
  {
    id: 'codex',
    name: 'Codex',
    steps: [
      { cmd: 'codex plugin marketplace add tdwhere123/do-it', at: 'shell', why: ['登记市场', 'register the marketplace'] },
      { cmd: 'codex plugin add do-it@tdwhere-do-it', at: 'shell', why: ['安装插件', 'install the plugin'] },
      { cmd: '/hooks', at: 'app', why: ['信任插件带的 hooks', 'trust the plugin’s hooks'] },
    ],
    note: [
      '第一条只登记，不安装。十个专业代理要另装：在仓库里运行 node bin/do-it.mjs setup --target=codex --only=agents。',
      'The first line only registers. The ten specialists install separately: node bin/do-it.mjs setup --target=codex --only=agents, from a checkout.',
    ],
  },
  {
    id: 'cursor',
    name: 'Cursor',
    steps: [
      ...CLONE,
      { cmd: 'npm run install:cursor-local', at: 'shell', why: ['构建并拷进本地插件目录', 'build, then copy into local plugins'] },
      { cmd: 'Developer: Reload Window', at: 'palette' },
    ],
    note: [
      'Cursor 不用斜杠命令。do-it 还没上架 Cursor 市场，先装到本地；团队也可以在后台从仓库导入。',
      'Cursor has no slash commands. do-it is not on Cursor’s marketplace yet, so it installs locally; a team can also import it from the repository.',
    ],
  },
  {
    id: 'pi',
    name: 'Pi',
    steps: [
      { cmd: 'pi install npm:@tdwhere/do-it-pi', at: 'shell' },
      { cmd: 'pi install npm:pi-subagents', at: 'shell', why: ['想用十个专业代理时', 'for the ten specialists'] },
      { cmd: '/do-it-status', at: 'app', why: ['检查 hooks 和代理工具', 'check hooks and agent tools'] },
    ],
    note: [
      'Pi 用单独的 npm 包，和插件同一个版本号。',
      'Pi takes its own npm package, versioned with the plugin.',
    ],
  },
  {
    id: 'grok',
    name: 'Grok Build',
    steps: [
      ...CLONE,
      { cmd: 'npm run build:generated && node scripts/build-grok-plugin.mjs', at: 'shell', why: ['生成 do-it-grok 插件包', 'generate the do-it-grok bundle'] },
      { cmd: 'agent plugin validate plugins/do-it-grok', at: 'shell' },
      { cmd: 'agent plugin install "$(pwd)/plugins/do-it-grok" --trust', at: 'shell' },
    ],
    note: [
      '用 Grok Build 自带的 agent 命令。插件名是 do-it-grok，免得和 Claude 的 do-it 撞名。',
      'Uses Grok Build’s own agent command. The plugin is named do-it-grok so it does not collide with Claude’s do-it.',
    ],
  },
]

/** A shell line before the host starts: the prompt, the command, and why. */
function Sh({ step }: { step: Step }) {
  const w = useWords()
  return (
    <p>
      <span className="a-cli-ps" aria-hidden="true">
        ~/project $
      </span>{' '}
      <code>{step.cmd}</code>
      {step.why && <span className="a-cli-dim"> # {w(...step.why)}</span>}
    </p>
  )
}

const Caret = () => <span className="a-cli-caret" aria-hidden="true" />

function Claude({ host }: { host: Host }) {
  const [first, last] = host.steps
  return (
    <div className="a-cli-screen">
      <div className="a-cli-head">
        <img className="a-cli-mark" src={claudeMark} alt="" width={94} height={65} />
        <div>
          <p>
            <strong>Claude Code</strong> <span className="a-cli-dim">v2.1.302</span>
          </p>
          <p className="a-cli-dim">Opus 5.5 with high effort</p>
          <p className="a-cli-dim">~/project</p>
        </div>
      </div>
      <p className="a-cli-past">❯ {first.cmd}</p>
      <div className="a-cli-foot">
        <p className="a-cli-right a-cli-dim">● high · /effort</p>
        <p className="a-cli-line">
          ❯ <code>{last.cmd}</code>
          <Caret />
        </p>
        <p className="a-cli-mode">
          ⏵⏵ auto mode on <span className="a-cli-dim">(shift+tab to cycle) · ← for agents</span>
        </p>
      </div>
    </div>
  )
}

function Codex({ host }: { host: Host }) {
  const w = useWords()
  const shell = host.steps.filter((s) => s.at === 'shell'),
    last = host.steps[host.steps.length - 1]
  return (
    <div className="a-cli-screen">
      <div className="a-cli-before">
        {shell.map((s) => (
          <Sh key={s.cmd} step={s} />
        ))}
        <p>
          <span className="a-cli-ps">~/project $</span> <code>codex</code>
        </p>
      </div>
      <div className="a-cli-codex">
        <p>
          <span className="a-cli-blue">&gt;_</span> <strong>OpenAI Codex</strong> <span className="a-cli-dim">(v0.163.0)</span>
        </p>
        <p className="a-cli-dim">{'   '}~/project</p>
      </div>
      <img className="a-cli-center" src={codexMark} alt="" width={356} height={419} />
      <div className="a-cli-foot">
        <p className="a-cli-band">
          › <code>{last.cmd}</code>
          <Caret />
          {last.why && <span className="a-cli-dim">{'   '}# {w(...last.why)}</span>}
        </p>
        <p className="a-cli-dim">{'  '}? for shortcuts</p>
      </div>
    </div>
  )
}

function Cursor({ host }: { host: Host }) {
  const shell = host.steps.filter((s) => s.at === 'shell'),
    palette = host.steps.find((s) => s.at === 'palette')
  const ic = { size: 14, strokeWidth: 1.6, 'aria-hidden': true } as const
  return (
    <div className="a-cli-screen a-cli-app">
      <div className="a-cli-menu" aria-hidden="true">
        <img src={cursorMark} alt="" width={16} height={18} />
        <span>File</span>
        <span>Edit</span>
        <span>View</span>
        <span>Help</span>
        <span className="a-cli-controls">
          <Minus {...ic} />
          <Square {...ic} size={12} />
          <X {...ic} />
        </span>
      </div>
      <div className="a-cli-window">
        <div className="a-cli-side" aria-hidden="true">
          <p className="a-cli-tools">
            <PanelLeft {...ic} />
            <span>
              <Search {...ic} />
              <ArrowLeft {...ic} />
              <ArrowRight {...ic} />
            </span>
          </p>
          <p data-on="">
            <ListFilter {...ic} /> New Chat
          </p>
          <p>
            <CalendarClock {...ic} /> Automations
          </p>
          <p>
            <Blocks {...ic} /> Customize
          </p>
          <p className="a-cli-group">
            Repositories
            <span>
              <ListFilter {...ic} />
              <FolderPlus {...ic} />
            </span>
          </p>
          <p>
            <FolderOpen {...ic} /> do-it
          </p>
          <p>
            <Folder {...ic} /> project
          </p>
        </div>
        <div className="a-cli-main">
          <p className="a-cli-top" aria-hidden="true">
            IDE <ArrowUpRight {...ic} size={12} /> <Ellipsis {...ic} /> <PanelRight {...ic} />
          </p>
          <div className="a-cli-palette">
            <p className="a-cli-dim">&gt; reload</p>
            <p className="a-cli-pick">{palette?.cmd}</p>
          </div>
          <p className="a-cli-repo" aria-hidden="true">
            do-it <ChevronDown {...ic} size={12} />
            <span>
              <Laptop {...ic} size={13} /> This PC <ChevronDown {...ic} size={12} />
            </span>
          </p>
          <div className="a-cli-composer">
            <p className="a-cli-dim">Plan, Build, / for skills, @ for context</p>
            <p className="a-cli-send" aria-hidden="true">
              <span className="a-cli-plus">
                <Plus {...ic} />
              </span>
              <span>
                Auto <ChevronDown {...ic} size={12} /> <Mic {...ic} />
                <span className="a-cli-go">
                  <AudioLines {...ic} size={13} />
                </span>
              </span>
            </p>
          </div>
          <div className="a-cli-term">
            <p className="a-cli-dim">Terminal</p>
            {shell.map((s) => (
              <Sh key={s.cmd} step={s} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Grok({ host }: { host: Host }) {
  return (
    <div className="a-cli-screen">
      <div className="a-cli-before">
        {host.steps.map((s) => (
          <Sh key={s.cmd} step={s} />
        ))}
        <p>
          <span className="a-cli-ps">~/project $</span> <code>agent</code>
        </p>
      </div>
      <p className="a-cli-dim a-cli-branch">
        <GitBranch size={13} strokeWidth={1.6} aria-hidden="true" /> main ~/project
      </p>
      <div className="a-cli-card">
        <img src={grokMark} alt="" width={140} height={154} />
        <div>
          <p>
            <strong>Grok Build</strong>
            {'  '}
            <span className="a-cli-dim">1.0.60</span>
          </p>
          <p className="a-cli-gold">New /learn skill!</p>
          <p className="a-cli-dim a-cli-wrap">Ask Grok to /learn from your past traces and tune Grok Build to how you work.</p>
          <p className="a-cli-keys">
            <strong>New worktree</strong>
            <span>ctrl+w</span>
          </p>
          <p className="a-cli-keys">
            <strong>Resume session</strong>
            <span>ctrl+r</span>
          </p>
          <p className="a-cli-keys">
            <strong>Quit</strong>
            <span>ctrl+d</span>
          </p>
        </div>
      </div>
      <div className="a-cli-foot">
        <p className="a-cli-boxed">
          ❯ <Caret />
          <span className="a-cli-dim a-cli-legend">Grok 4.7 (xhigh) · always-approve</span>
        </p>
      </div>
    </div>
  )
}

function Pi({ host }: { host: Host }) {
  const w = useWords()
  const shell = host.steps.filter((s) => s.at === 'shell'),
    last = host.steps[host.steps.length - 1]
  return (
    <div className="a-cli-screen">
      <div className="a-cli-before">
        {shell.map((s) => (
          <Sh key={s.cmd} step={s} />
        ))}
        <p>
          <span className="a-cli-ps">~/project $</span> <code>pi</code>
        </p>
      </div>
      <div className="a-cli-head">
        <img className="a-cli-mark a-cli-pi" src={piMark} alt="" width={88} height={104} />
        <div>
          <p>
            <strong className="a-cli-navy">pi</strong> <span className="a-cli-dim">v1.3.0</span>
          </p>
          <p className="a-cli-dim">escape interrupt · ctrl+c/ctrl+d clear/exit · / commands · ! bash · ctrl+o more</p>
          <p className="a-cli-dim">Press ctrl+o to show full startup help and loaded resources.</p>
          <p className="a-cli-blue a-cli-gap">
            There are many agent harnesses, but this one is <strong>yours</strong>.
          </p>
        </div>
      </div>
      <div className="a-cli-foot">
        <p className="a-cli-ruled">
          ❯ <code>{last.cmd}</code>
          <Caret />
          {last.why && <span className="a-cli-dim">{'   '}# {w(...last.why)}</span>}
        </p>
        <p className="a-cli-status">
          ~/project · <span className="a-cli-dim">idle</span>
        </p>
      </div>
    </div>
  )
}

const screens: Record<string, (props: { host: Host }) => ReactNode> = {
  claude: Claude,
  codex: Codex,
  cursor: Cursor,
  grok: Grok,
  pi: Pi,
}

/** Each host the way its own start screen looks, in a plain light terminal window. */
function Screen({ host }: { host: Host }) {
  const Inner = screens[host.id]
  return (
    <div className="a-cli" data-host={host.id}>
      {host.id !== 'cursor' && (
        <p className="a-cli-tab" aria-hidden="true">
          <span>{host.id === 'grok' ? 'agent' : host.id}</span>
        </p>
      )}
      <Inner host={host} />
    </div>
  )
}

/** One line of commands per host, shown the way each host looks, copied as plain commands. */
export default function Hosts() {
  const w = useWords()
  const [at, setAt] = useState(0),
    [copied, setCopied] = useState(false)
  const host = hosts[at]
  const copy = () =>
    navigator.clipboard?.writeText(host.steps.map((s) => s.cmd).join('\n')).then(
      () => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1800)
      },
      () => setCopied(false),
    )
  return (
    <div className="a-hosts">
      <div className="a-hosts-tabs" role="group" aria-label={w('宿主', 'Host')}>
        {hosts.map((h, i) => (
          <button
            key={h.id}
            type="button"
            aria-pressed={i === at}
            onClick={() => {
              setAt(i)
              setCopied(false)
            }}
          >
            {h.name}
          </button>
        ))}
      </div>
      <div className="a-hosts-frame">
        <Screen host={host} key={host.id} />

      </div>
      <button type="button" className="a-hosts-copy" onClick={copy}>
        {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
        {copied ? w('已复制', 'Copied') : w(`复制 ${host.name} 的安装命令`, `Copy the ${host.name} commands`)}
      </button>
      <p className="a-hosts-note">{w(...host.note)}</p>
    </div>
  )
}
