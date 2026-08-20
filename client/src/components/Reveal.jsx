import { motion } from 'framer-motion'
import { usePrefersReducedMotion } from '../hooks/useApi'

/**
 * Scroll-triggered reveal. Content rises into place once, the way a curtain
 * goes up. It does not replay when you scroll back, which would turn the page
 * into a fidget.
 */
export default function Reveal({
  children,
  delay = 0,
  y = 28,
  className = '',
  as = 'div',
  ...rest
}) {
  const reducedMotion = usePrefersReducedMotion()
  const Component = motion[as] ?? motion.div

  if (reducedMotion) {
    const Static = as
    return (
      <Static className={className} {...rest}>
        {children}
      </Static>
    )
  }

  return (
    <Component
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.85, delay, ease: [0.16, 1, 0.3, 1] }}
      {...rest}
    >
      {children}
    </Component>
  )
}
