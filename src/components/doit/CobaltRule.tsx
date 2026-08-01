/** Thin cobalt rule — quiet museum section break for do-it (not a card). */
import SharedCobaltRule from '@/components/CobaltRule'

export default function CobaltRule({ className }: { className?: string }) {
  return <SharedCobaltRule className={className} variant="doit" />
}
