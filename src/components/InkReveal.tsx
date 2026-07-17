import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

const ZEN = [0.22, 1, 0.36, 1] as [number, number, number, number]

/**
 * 墨显 Ink Reveal — y 40→0, blur 8→0, opacity 0→1, 0.9s ease-zen, triggered at 20% viewport.
 * Shared entrance primitive for section titles and text blocks.
 */
export default function InkReveal({
  children,
  className,
  delay = 0,
  y = 40,
  amount = 0.2,
  once = true,
}: {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
  amount?: number
  once?: boolean
}) {
  return (
    <motion.div
      className={className}
      initial={{ y, opacity: 0, filter: 'blur(8px)' }}
      whileInView={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
      viewport={{ once, amount }}
      transition={{ duration: 0.9, ease: ZEN, delay }}
    >
      {children}
    </motion.div>
  )
}
