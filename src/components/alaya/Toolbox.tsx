import { motion } from 'framer-motion'
import { CloudOff } from 'lucide-react'
import { useLang } from '@/context/LangContext'
import { alayaContent } from '@/content/alaya'
import InkReveal from '@/components/InkReveal'
import Kicker from '@/components/Kicker'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const ZEN = [0.22, 1, 0.36, 1] as [number, number, number, number]

function ToolList({ items }: { items: string[] }) {
  return (
    <ul className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
      {items.map((tool, i) => (
        <motion.li
          key={tool}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: ZEN, delay: i * 0.02 }}
          className="font-mono text-sm text-ink-3 transition-colors duration-300 hover:text-ink"
        >
          {tool}
        </motion.li>
      ))}
    </ul>
  )
}

/** S8 · The Toolbox — 16 MCP tools + 13 CLI verbs accordion; zero-cloud footer line. */
export default function Toolbox() {
  const { lang } = useLang()
  const a = alayaContent[lang].toolbox

  return (
    <section className="mx-auto max-w-reading px-5 py-24 md:py-32" aria-label={a.kicker}>
      <InkReveal amount={0.5}>
        <Kicker>{a.kicker}</Kicker>
      </InkReveal>

      <InkReveal amount={0.3} className="mt-10">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="mcp" className="rounded-[10px] border border-hairline bg-paper px-5">
            <AccordionTrigger className="py-5 hover:no-underline">
              <span className="flex flex-col items-start gap-1 text-left">
                <span className="font-serif text-lg font-semibold text-ink">{a.mcpTitle}</span>
                <span className="font-mono text-[11px] font-normal text-faint">{a.mcpNote}</span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-6">
              <ToolList items={a.mcpTools} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="cli"
            className="mt-3 rounded-[10px] border border-hairline bg-paper px-5"
          >
            <AccordionTrigger className="py-5 hover:no-underline">
              <span className="font-serif text-lg font-semibold text-ink">{a.cliTitle}</span>
            </AccordionTrigger>
            <AccordionContent className="pb-6">
              <ToolList items={a.cliVerbs} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </InkReveal>

      <InkReveal amount={0.5} className="mt-8">
        <p className="flex items-center gap-2 font-mono text-xs text-faint">
          <CloudOff className="h-4 w-4 shrink-0" aria-hidden="true" />
          {a.zero}
        </p>
      </InkReveal>
    </section>
  )
}
