import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'
import { useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useEscapeKey, useScrollLock } from '../hooks/useUi'
import { FeatureVideo } from './VideoPlayer'

/**
 * Full-screen preview for one gallery item.
 *
 * Keyboard driven throughout: arrows move, Escape leaves, and focus is parked
 * on the close button so tabbing never wanders back into the page behind.
 */
export default function Lightbox({ items, index, onClose, onStep }) {
  const closeRef = useRef(null)
  const isOpen = index !== null && index >= 0 && index < items.length
  const item = isOpen ? items[index] : null

  useScrollLock(isOpen)
  useEscapeKey(isOpen, onClose)

  const step = useCallback(
    (delta) => {
      if (items.length === 0) return
      onStep((index + delta + items.length) % items.length)
    },
    [index, items.length, onStep],
  )

  useEffect(() => {
    if (!isOpen) return

    const onKey = (event) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        step(1)
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        step(-1)
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, step])

  useEffect(() => {
    if (isOpen) closeRef.current?.focus({ preventScroll: true })
  }, [isOpen])

  return createPortal(
    <AnimatePresence>
      {item ? (
        <motion.div
          className="fixed inset-0 z-[110] flex flex-col bg-ink/97 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          role="dialog"
          aria-modal="true"
          aria-label={item.title || 'Gallery item'}
        >
          <div className="flex items-center justify-between gap-4 border-b border-ink-line px-4 py-4 md:px-8">
            <p className="u-meta tabular-nums">
              {String(index + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
            </p>

            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className="grid size-10 place-items-center rounded-full border border-ink-line text-ivory-dim transition hover:border-gold-deep hover:text-gold-lift"
              aria-label="Close"
            >
              <X size={16} strokeWidth={1.5} />
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center p-4 md:p-10">
            <button
              type="button"
              onClick={() => step(-1)}
              className="absolute left-3 z-10 grid size-11 place-items-center rounded-full border border-ink-line bg-ink/70 text-ivory transition hover:border-gold-deep hover:text-gold-lift md:left-8 md:size-14"
              aria-label="Previous"
            >
              <ArrowLeft size={18} strokeWidth={1.5} />
            </button>

            <AnimatePresence mode="wait">
              {item.mediaType === 'video' ? (
                <motion.div
                  key={item.id}
                  className="flex h-full w-full items-center justify-center"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  <FeatureVideo
                    src={item.image}
                    poster={item.poster}
                    title={item.title}
                    autoStart
                    className="h-full w-full bg-transparent"
                  />
                </motion.div>
              ) : (
                <motion.img
                  key={item.id}
                  src={item.image}
                  alt={item.title || ''}
                  className="max-h-full max-w-full object-contain"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                />
              )}
            </AnimatePresence>

            <button
              type="button"
              onClick={() => step(1)}
              className="absolute right-3 z-10 grid size-11 place-items-center rounded-full border border-ink-line bg-ink/70 text-ivory transition hover:border-gold-deep hover:text-gold-lift md:right-8 md:size-14"
              aria-label="Next"
            >
              <ArrowRight size={18} strokeWidth={1.5} />
            </button>
          </div>

          <div className="border-t border-ink-line px-4 py-5 text-center md:px-8">
            {item.title ? (
              <p className="font-display text-xl font-semibold text-ivory">{item.title}</p>
            ) : null}
            {item.caption ? <p className="mt-1 text-sm text-ivory-dim">{item.caption}</p> : null}
            <p className="u-eyebrow mt-3">
              {item.brand}
              {item.category ? ` · ${item.category}` : ''}
            </p>
            <p className="mt-3 hidden text-xs text-ivory-faint md:block">
              Arrow keys to move, Escape to close
            </p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
