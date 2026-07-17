import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

const ZEN = [0.22, 1, 0.36, 1] as [number, number, number, number]

/**
 * 门开 Gate Open — two vertical lines slide apart (0.7s, stagger 0.08s)
 * over the entering block; children should ink-reveal right after.
 * Shared by do-it and Write-Right heroes; do-it passes brass lineClassName.
 */
export default function GateOpen({
  children,
  className,
  lineClassName = 'bg-ink/35',
}: {
  children: ReactNode
  className?: string
  lineClassName?: string
}) {
  return (
    <div className={cn('relative', className)}>
      {children}
      <motion.span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute left-1/2 top-2 h-[calc(100%-1rem)] w-px',
          lineClassName,
        )}
        initial={{ x: 0, opacity: 1 }}
        animate={{ x: -56, opacity: 0 }}
        transition={{ duration: 0.7, ease: ZEN }}
      />
      <motion.span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute left-1/2 top-2 h-[calc(100%-1rem)] w-px',
          lineClassName,
        )}
        initial={{ x: 0, opacity: 1 }}
        animate={{ x: 56, opacity: 0 }}
        transition={{ duration: 0.7, ease: ZEN, delay: 0.08 }}
      />
    </div>
  )
}
