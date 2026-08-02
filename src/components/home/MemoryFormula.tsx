import { useMemo } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { motion, useReducedMotion } from 'framer-motion'
import { useLang } from '@/context/LangContext'
import { ZEN } from '@/lib/motion'

/**
 * The mathematics of memory, typeset — the UGAF core from
 * .do-it/brainstorm/do-soul-alaya-UGAF-math-core.md, rendered with KaTeX
 * (never raw source text). A full-width editorial band under the works grid:
 * the pipeline set large like a title, the three pillar equations scattered
 * off-axis rather than boxed into columns.
 */

const PIPELINE = String.raw`q,\, S_t \;\xrightarrow{\mathcal{Q}}\; Q_q \;\xrightarrow{\Omega}\; H_q \;\xrightarrow{\mathcal{A}}\; X_q \;\xrightarrow{\mathcal{G}_L}\; \widetilde{X}_q \;\xrightarrow{\mathcal{M}}\; Z_q \;\xrightarrow{\operatorname{Select}_{\Gamma}}\; D_q`

const PILLARS = [
  {
    key: 'write' as const,
    tex: String.raw`S_{t+1} = \mathcal{W}(S_t,\, x_t)`,
    /** scattered, not gridded: left / lower-center / right */
    place: 'sm:col-span-4 sm:col-start-1 sm:text-left',
  },
  {
    key: 'propagate' as const,
    tex: String.raw`p_q = \sum_{\ell,\, r} \beta_{\ell r}\, G_r^{\ell}\, \phi(b)`,
    place: 'sm:col-span-4 sm:col-start-5 sm:mt-12 sm:text-center',
  },
  {
    key: 'select' as const,
    tex: String.raw`D_q = \operatorname*{arg\,max}_{X \subseteq F_q}\; F_q(X)`,
    place: 'sm:col-span-4 sm:col-start-9 sm:text-right',
  },
]

function TeX({ tex, display = false }: { tex: string; display?: boolean }) {
  const html = useMemo(
    () => katex.renderToString(tex, { displayMode: display, throwOnError: false }),
    [tex, display],
  )
  // KaTeX output is generated from our own constant strings — safe to inject.
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}

export default function MemoryFormula() {
  const { t } = useLang()
  const reduce = useReducedMotion()
  const f = t.works.formula

  return (
    <div className="mt-20 md:mt-28">
      <p className="text-center font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
        {f.title}
      </p>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 1, ease: ZEN }}
        className="mt-7 overflow-x-auto pb-1 text-center text-ink"
      >
        <span className="inline-block text-[clamp(16px,2.3vw,26px)]">
          <TeX tex={PIPELINE} display />
        </span>
      </motion.div>

      <div className="mt-12 grid grid-cols-1 gap-8 text-center sm:grid-cols-12 sm:gap-4 md:mt-14">
        {PILLARS.map(({ key, tex, place }, i) => (
          <motion.div
            key={key}
            initial={reduce ? false : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.7, ease: ZEN, delay: reduce ? 0 : i * 0.1 }}
            className={place}
          >
            <div className="overflow-x-auto pb-1 text-[14px] text-ink-2">
              <span className="inline-block">
                <TeX tex={tex} display />
              </span>
            </div>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
              {f[key]}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
