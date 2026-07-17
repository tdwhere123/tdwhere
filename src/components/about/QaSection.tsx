import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useLang } from '@/context/LangContext'
import { aboutContent } from '@/content/about'
import InkReveal from '@/components/InkReveal'
import Kicker from '@/components/Kicker'

const ZEN = [0.22, 1, 0.36, 1] as [number, number, number, number]

/**
 * S2 · 自问自答 Asking Myself — radix accordion, first item open by default.
 * Question hover draws a 2px brass dash on the left; answers open in 0.35s.
 */
export default function QaSection() {
  const { lang } = useLang()
  const c = aboutContent[lang].qa

  return (
    <section aria-labelledby="qa-title" className="mx-auto max-w-shell px-5 py-[clamp(72px,12vh,140px)] md:px-10">
      <div className="mx-auto max-w-reading">
        <InkReveal>
          <Kicker>{c.kicker}</Kicker>
          <h2 id="qa-title" className="mt-6 font-serif text-h2 font-semibold text-museum-ink">
            {c.title}
          </h2>
        </InkReveal>

        <AccordionPrimitive.Root
          type="single"
          collapsible
          defaultValue="q0"
          className="mt-10 border-t border-museum-line"
        >
          {c.items.map((item, i) => (
            <motion.div
              key={item.q}
              initial={{ y: 24, opacity: 0, filter: 'blur(6px)' }}
              whileInView={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.7, ease: ZEN, delay: i * 0.08 }}
            >
              <AccordionPrimitive.Item value={`q${i}`} className="border-b border-museum-line">
                <AccordionPrimitive.Header className="flex">
                  <AccordionPrimitive.Trigger className="group relative flex flex-1 items-start justify-between gap-4 py-5 pl-5 text-left font-mono text-sm text-museum-muted transition-colors duration-300 hover:text-museum-ink md:text-[15px]">
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 scale-y-0 bg-museum-brass transition-transform ease-zen [transition-duration:250ms] group-hover:scale-y-100"
                    />
                    <span>{item.q}</span>
                    <Plus
                      aria-hidden="true"
                      className="mt-0.5 h-4 w-4 shrink-0 text-museum-muted/60 transition-transform duration-300 ease-zen group-data-[state=open]:rotate-45 group-data-[state=open]:text-museum-brass"
                    />
                  </AccordionPrimitive.Trigger>
                </AccordionPrimitive.Header>
                <AccordionPrimitive.Content className="group/content overflow-hidden data-[state=closed]:animate-[accordion-up_0.3s_ease-out] data-[state=open]:animate-[accordion-down_0.35s_cubic-bezier(0.22,1,0.36,1)]">
                  <p className="translate-y-2.5 pb-6 pl-5 pr-2 text-[15px] leading-[1.85] text-museum-muted opacity-0 transition-all ease-zen [transition-duration:350ms] group-data-[state=open]/content:translate-y-0 group-data-[state=open]/content:opacity-100">
                    {item.a}
                  </p>
                </AccordionPrimitive.Content>
              </AccordionPrimitive.Item>
            </motion.div>
          ))}
        </AccordionPrimitive.Root>
      </div>
    </section>
  )
}
