import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useEscapeKey, useScrollLock } from '../hooks/useApi'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Modal dialog with a real focus trap: focus moves in on open, Tab cycles
 * inside, and focus returns to whatever opened it on close. Escape and a
 * backdrop click both dismiss.
 */
export default function Dialog({
  open,
  onClose,
  title,
  label,
  children,
  size = 'md',
  className = '',
}) {
  const panelRef = useRef(null)
  const returnFocusRef = useRef(null)

  useScrollLock(open)
  useEscapeKey(open, onClose)

  useEffect(() => {
    if (!open) return

    returnFocusRef.current = document.activeElement

    // Wait for the panel to mount before hunting for something to focus.
    const timer = window.setTimeout(() => {
      const panel = panelRef.current
      if (!panel) return
      const first = panel.querySelector(FOCUSABLE)
      ;(first ?? panel).focus({ preventScroll: true })
    }, 40)

    return () => {
      window.clearTimeout(timer)
      returnFocusRef.current?.focus?.({ preventScroll: true })
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    const handleTab = (event) => {
      if (event.key !== 'Tab') return

      const panel = panelRef.current
      if (!panel) return

      const focusable = [...panel.querySelectorAll(FOCUSABLE)].filter(
        (node) => node.offsetParent !== null,
      )
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', handleTab)
    return () => window.removeEventListener('keydown', handleTab)
  }, [open])

  const widths = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  }

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center overflow-y-auto p-0 sm:items-center sm:p-6">
          <motion.div
            className="fixed inset-0 bg-ink/85 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={label ?? title}
            tabIndex={-1}
            className={`surface relative z-10 w-full ${widths[size]} max-h-[92vh] overflow-y-auto rounded-t-2xl outline-none sm:rounded-sm ${className}`}
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 z-20 grid size-10 place-items-center rounded-full border border-ink-line bg-ink/70 text-ivory-dim transition hover:border-gold-deep hover:text-gold-lift"
              aria-label="Close"
            >
              <X size={16} strokeWidth={1.5} />
            </button>

            {children}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
