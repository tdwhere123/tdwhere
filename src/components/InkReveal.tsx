import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { ZEN } from '@/lib/motion'


/**
 * 墨显 Ink Reveal — y + opacity only (no filter blur: cheaper paint, same ink feel).
 * Triggered at `amount` viewport. Shared entrance for section titles / blocks.
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
      initial={{ y, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once, amount, margin: '0px 0px -8% 0px' }}
      transition={{ duration: 0.75, ease: ZEN, delay }}
    >
      {children}
    </motion.div>
  )
}
