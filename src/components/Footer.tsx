import { ArrowUp } from 'lucide-react'
import { useLang } from '@/context/LangContext'
import GateDivider from '@/components/GateDivider'
import CopyEmail from '@/components/CopyEmail'
import InkReveal from '@/components/InkReveal'
import { scrollToTop } from '@/lib/smooth-scroll'

export default function Footer() {
  const { t } = useLang()
  return (
    <footer className="relative overflow-hidden bg-paper-warm">
      {/* faint distant mountains, bottom aligned */}
      <img
        src="/ink-strip.png"
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="pointer-events-none absolute inset-x-0 bottom-0 w-full select-none opacity-12"
      />

      <GateDivider className="relative z-10" />

      <div className="relative z-10 mx-auto max-w-shell px-5 pb-10 pt-16 md:px-10 md:pt-24">
        <div className="flex items-start justify-between gap-8">
          <div className="max-w-xl">
            <InkReveal>
              <p className="font-serif text-[clamp(24px,3.4vw,40px)] font-semibold leading-snug text-ink">
                {t.footer.bigLine}
              </p>
            </InkReveal>

            <InkReveal delay={0.12} className="mt-8 flex flex-col gap-4">
              <CopyEmail textClassName="text-sm" />
              <a
                href={t.meta.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="group relative w-fit font-mono text-sm text-ink-3 transition-colors duration-300 hover:text-ink"
              >
                {t.meta.github}
                <span
                  aria-hidden="true"
                  className="absolute -bottom-0.5 left-0 h-px w-0 bg-ink transition-all duration-300 ease-zen group-hover:w-full"
                />
              </a>
            </InkReveal>
          </div>

          {/* vertical decoration */}
          <span
            aria-hidden="true"
            className="vertical-rl hidden shrink-0 select-none font-serif text-base text-faint md:block"
          >
            {t.footer.vertical}
          </span>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-hairline pt-6">
          <p className="font-mono text-xs text-faint">
            {t.footer.copyright} · {t.footer.license}
          </p>
          <button
            type="button"
            onClick={() => scrollToTop(false)}
            aria-label={t.common.backTop}
            className="group grid h-11 w-11 place-items-center rounded-full border border-hairline text-ink-3 transition-all duration-300 ease-zen hover:-translate-y-1 hover:border-ink hover:text-ink"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>
    </footer>
  )
}
