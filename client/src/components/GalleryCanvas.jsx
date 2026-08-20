import { Play } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { usePrefersReducedMotion } from '../hooks/useApi'

/**
 * A perfect-fit tiling pattern.
 *
 * Eight tiles filling a 4x4 cell block with no holes, which is what keeps the
 * plane gapless however many images there are: a plain auto-placed CSS grid
 * with mixed spans always leaves ragged holes, and this does not.
 *
 *   A A B C      A: 2x2   B: 1x1   C: 1x1
 *   A A D D      D: 2x1
 *   E F G G      E: 1x1   F: 1x1   G: 2x2
 *   H H G G      H: 2x1
 */
const PATTERN = [
  { x: 0, y: 0, w: 2, h: 2 },
  { x: 2, y: 0, w: 1, h: 1 },
  { x: 3, y: 0, w: 1, h: 1 },
  { x: 2, y: 1, w: 2, h: 1 },
  { x: 0, y: 2, w: 1, h: 1 },
  { x: 1, y: 2, w: 1, h: 1 },
  { x: 2, y: 2, w: 2, h: 2 },
  { x: 0, y: 3, w: 2, h: 1 },
]

const COLS = 4
const BLOCK_ROWS = 4

/** Below this the drag surface is too small to be worth it; we stack instead. */
const MIN_CANVAS_WIDTH = 640

/** A press that travels further than this was a drag, not a click. */
const CLICK_SLOP = 8

const clampCell = (width) => Math.max(160, Math.min(300, Math.round(width / 5.2)))

export default function GalleryCanvas({ items, onOpen }) {
  const viewportRef = useRef(null)
  const planeRef = useRef(null)

  const [size, setSize] = useState({ width: 0, height: 0 })
  const [isFramed, setIsFramed] = useState(false)
  const reducedMotion = usePrefersReducedMotion()

  // Position, destination and drag velocity all live in refs: the animation
  // loop runs every frame and must never trigger a React render.
  const offset = useRef({ x: 0, y: 0 })
  const target = useRef({ x: 0, y: 0 })
  const tilt = useRef({ x: 0, y: 0 })
  const drag = useRef({ active: false, moved: 0, lastX: 0, lastY: 0 })

  useLayoutEffect(() => {
    const node = viewportRef.current
    if (!node) return

    let timer = 0
    let attempts = 0

    const measure = () => {
      const width = node.clientWidth
      const height = node.clientHeight

      setSize((current) =>
        current.width === width && current.height === height ? current : { width, height },
      )

      // The first read can land before layout has settled, and a zero width
      // would otherwise stick: ResizeObserver is not guaranteed to deliver a
      // correcting callback, so retry briefly on our own.
      if (width === 0 && attempts < 20) {
        attempts += 1
        timer = window.setTimeout(measure, 60)
      }
    }

    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(node)
    window.addEventListener('resize', measure)

    return () => {
      window.clearTimeout(timer)
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  /**
   * A safety net for the measurement above.
   *
   * ResizeObserver is the right tool and handles the normal case, but it is not
   * guaranteed to fire in every embedding (some in-app webviews never deliver a
   * callback), and a stale width would leave the wrong variant on screen for
   * good. Re-reading on each render costs one layout query and only sets state
   * when the number actually changed, so it cannot loop.
   */
  // eslint-disable-next-line react-hooks/exhaustive-deps -- deliberate: this
  // runs after every render so a stale size always corrects itself. The
  // equality check below means it can only set state when the number really
  // changed, so it cannot cascade.
  useLayoutEffect(() => {
    const node = viewportRef.current
    if (!node) return

    const width = node.clientWidth
    const height = node.clientHeight

    if (width !== size.width || height !== size.height) {
      setSize({ width, height })
    }
  })

  const cell = clampCell(size.width || 1200)

  const layout = useMemo(() => {
    const blockWidth = COLS * cell
    const blockHeight = BLOCK_ROWS * cell

    if (items.length === 0) {
      return { tiles: [], planeWidth: blockWidth, planeHeight: blockHeight }
    }

    // The plane must be larger than the viewport in both directions. If it is
    // not, two copies of it are on screen at once and the same photograph shows
    // up twice side by side, which is exactly what a repeating plane should
    // never let you notice.
    const viewportW = size.width || blockWidth
    const viewportH = size.height || blockHeight

    let blocksX = Math.max(1, Math.ceil((viewportW * 1.15) / blockWidth))
    let blocksY = Math.max(1, Math.ceil((viewportH * 1.15) / blockHeight))

    // And there must be room for every image to appear at least once.
    const needed = Math.ceil(items.length / PATTERN.length)
    while (blocksX * blocksY < needed) {
      if (blocksX <= blocksY) blocksX += 1
      else blocksY += 1
    }

    const slots = blocksX * blocksY * PATTERN.length

    const tiles = Array.from({ length: slots }, (_, position) => {
      const slot = PATTERN[position % PATTERN.length]
      const block = Math.floor(position / PATTERN.length)
      const blockX = block % blocksX
      const blockY = Math.floor(block / blocksX)

      // Every slot is filled. Slots past the item count cycle back to the
      // start, because one repeat on a plane that already repeats is invisible
      // whereas a hole is not.
      const index = position % items.length

      return {
        item: items[index],
        index,
        position,
        x: (blockX * COLS + slot.x) * cell,
        y: (blockY * BLOCK_ROWS + slot.y) * cell,
        w: slot.w * cell,
        h: slot.h * cell,
      }
    })

    return {
      tiles,
      planeWidth: blocksX * blockWidth,
      planeHeight: blocksY * blockHeight,
    }
  }, [items, cell, size])

  const copies = useMemo(() => {
    if (!size.width || !layout.planeWidth) return [{ ox: 0, oy: 0 }]

    const across = Math.ceil(size.width / layout.planeWidth) + 1
    const down = Math.ceil(size.height / layout.planeHeight) + 1

    const list = []
    for (let row = 0; row < down; row += 1) {
      for (let column = 0; column < across; column += 1) {
        list.push({ ox: column * layout.planeWidth, oy: row * layout.planeHeight })
      }
    }
    return list
  }, [size, layout])

  /**
   * Snap the stage into view as you reach it, then hand the wheel over to
   * panning.
   *
   * A drag surface that is half on screen is awkward: you cannot see what you
   * are moving, and the wheel is ambiguous between scrolling the page and
   * panning the plane. So once it is meaningfully visible the page scrolls it
   * fully into frame, and only from then on does the wheel pan. That also
   * leaves a clean way back out, because the wheel goes back to scrolling the
   * page as soon as the stage is not fully framed.
   */
  useEffect(() => {
    const node = viewportRef.current
    if (!node) return

    let snapped = false

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFramed(entry.intersectionRatio > 0.985)

        if (entry.intersectionRatio > 0.985) {
          snapped = true
          return
        }

        // Re-arm once it has properly left, so it can snap again on return.
        if (entry.intersectionRatio < 0.15) snapped = false

        if (!snapped && entry.isIntersecting && entry.intersectionRatio > 0.4) {
          snapped = true
          node.scrollIntoView({
            behavior: reducedMotion ? 'auto' : 'smooth',
            block: 'center',
          })
        }
      },
      { threshold: [0, 0.15, 0.4, 0.7, 0.99, 1] },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [reducedMotion])

  /* --- the motion loop --------------------------------------------------- */

  useEffect(() => {
    if (!layout.planeWidth) return

    let frame = 0
    const wrap = (value, span) => ((value % span) + span) % span

    const tick = () => {
      const ease = reducedMotion ? 1 : 0.09

      const previousX = offset.current.x
      const previousY = offset.current.y

      offset.current.x += (target.current.x - offset.current.x) * ease
      offset.current.y += (target.current.y - offset.current.y) * ease

      // The plane leans into the direction of travel and settles back when it
      // stops. Driving the tilt from actual velocity is what makes it read as a
      // physical surface rather than a decorative rotation.
      if (!reducedMotion) {
        const velocityX = offset.current.x - previousX
        const velocityY = offset.current.y - previousY
        const clamp = (value) => Math.max(-6, Math.min(6, value))

        tilt.current.y += (clamp(velocityX * 0.14) - tilt.current.y) * 0.08
        tilt.current.x += (clamp(-velocityY * 0.14) - tilt.current.x) * 0.08
      }

      const plane = planeRef.current
      if (plane) {
        const x = wrap(offset.current.x, layout.planeWidth) - layout.planeWidth
        const y = wrap(offset.current.y, layout.planeHeight) - layout.planeHeight
        plane.style.transform = reducedMotion
          ? `translate3d(${x}px, ${y}px, 0)`
          : `rotateX(${tilt.current.x.toFixed(3)}deg) rotateY(${tilt.current.y.toFixed(
              3,
            )}deg) translate3d(${x}px, ${y}px, 0)`
      }

      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [layout, reducedMotion])

  /* --- input ------------------------------------------------------------- */

  /**
   * Dragging is tracked on the window rather than with setPointerCapture.
   * Capturing on the surface retargets every later pointer event to it, which
   * means the browser never fires a click on the tile underneath and nothing
   * ever opens. Activation is handled on pointerup instead.
   */
  const onPointerDown = useCallback((event) => {
    if (event.button !== undefined && event.button !== 0) return

    drag.current = { active: true, moved: 0, lastX: event.clientX, lastY: event.clientY }

    const onMove = (moveEvent) => {
      const state = drag.current
      if (!state.active) return

      const dx = moveEvent.clientX - state.lastX
      const dy = moveEvent.clientY - state.lastY

      state.moved += Math.abs(dx) + Math.abs(dy)
      state.lastX = moveEvent.clientX
      state.lastY = moveEvent.clientY

      target.current.x += dx
      target.current.y += dy
    }

    const onUp = (upEvent) => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)

      const state = drag.current
      state.active = false
      if (state.moved > CLICK_SLOP) return

      // A press that did not travel is a click. Work out what is under it.
      const node = document.elementFromPoint(upEvent.clientX, upEvent.clientY)
      const tile = node?.closest?.('[data-tile-index]')
      if (tile) onOpen(Number(tile.dataset.tileIndex))
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }, [onOpen])

  useEffect(() => {
    const node = viewportRef.current
    if (!node) return

    const onWheel = (event) => {
      // Not fully framed yet: let the page scroll, so you can reach the stage
      // and leave it again normally.
      if (!isFramed) return

      event.preventDefault()
      target.current.x -= event.deltaX
      target.current.y -= event.deltaY
    }

    node.addEventListener('wheel', onWheel, { passive: false })
    return () => node.removeEventListener('wheel', onWheel)
  }, [isFramed])

  const onKeyDown = useCallback(
    (event) => {
      const moves = {
        ArrowLeft: [cell, 0],
        ArrowRight: [-cell, 0],
        ArrowUp: [0, cell],
        ArrowDown: [0, -cell],
      }
      const move = moves[event.key]
      if (!move) return

      event.preventDefault()
      target.current.x += move[0]
      target.current.y += move[1]
    },
    [cell],
  )

  const isNarrow = size.width > 0 && size.width < MIN_CANVAS_WIDTH
  if (isNarrow) return <StackedGallery items={items} onOpen={onOpen} />

  return (
    <div
      ref={viewportRef}
      role="application"
      aria-label="Gallery. Drag to move, arrow keys to pan, click an image to open it."
      tabIndex={0}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      className="gallery-stage relative h-[78svh] w-full cursor-grab touch-none select-none overflow-hidden bg-ink active:cursor-grabbing"
    >
      <div ref={planeRef} className="gallery-plane absolute left-0 top-0">
        {copies.map((copy) => (
          <div
            key={`${copy.ox}-${copy.oy}`}
            className="gallery-plane absolute left-0 top-0"
            style={{ transform: `translate3d(${copy.ox}px, ${copy.oy}px, 0)` }}
          >
            {layout.tiles.map((tile) => (
              <Tile key={`${copy.ox}-${copy.oy}-${tile.position}`} tile={tile} />
            ))}
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(125%_105%_at_50%_50%,transparent_58%,var(--color-ink)_100%)]" />

      <p className="u-meta pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 text-[0.625rem] opacity-60">
        Drag to explore
      </p>
    </div>
  )
}

function Tile({ tile }) {
  const { item, index, x, y, w, h } = tile
  const isVideo = item.mediaType === 'video'

  return (
    <div
      data-tile-index={index}
      role="button"
      tabIndex={-1}
      aria-label={`${isVideo ? 'Play' : 'Open'} ${item.title || 'item'}`}
      className="gallery-tile absolute cursor-pointer overflow-hidden bg-ink-soft"
      style={{ transform: `translate3d(${x}px, ${y}px, 0)`, width: w, height: h }}
    >
      <img
        src={isVideo ? item.poster || item.image : item.image}
        alt={item.title || ''}
        loading="lazy"
        draggable={false}
        className="pointer-events-none size-full object-cover"
      />

      <span className="pointer-events-none absolute inset-0 bg-royal-deep/0 transition-colors duration-500 group-hover:bg-royal-deep/30" />

      {isVideo ? (
        <span className="pointer-events-none absolute inset-0 grid place-items-center">
          <span className="grid size-12 place-items-center rounded-full border border-ivory/35 bg-ink/55 text-ivory backdrop-blur-sm">
            <Play size={16} strokeWidth={1.5} className="ml-0.5" fill="currentColor" />
          </span>
        </span>
      ) : null}

      <span className="scrim-soft pointer-events-none absolute inset-x-0 bottom-0 p-3 text-left opacity-0 transition-opacity duration-500">
        <span className="block font-display text-sm font-semibold leading-tight text-ivory">
          {item.title}
        </span>
      </span>
    </div>
  )
}

/**
 * Phones get a plain column instead. A drag plane fights the page scroll on
 * touch, and one-handed panning around an infinite canvas is not a pleasure.
 */
function StackedGallery({ items, onOpen }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item, index) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onOpen(index)}
          aria-label={`${item.mediaType === 'video' ? 'Play' : 'Open'} ${item.title || 'item'}`}
          className={`group relative overflow-hidden bg-ink-soft ${
            item.orientation === 'landscape' ? 'col-span-2 aspect-[3/2]' : 'aspect-[3/4]'
          }`}
        >
          <img
            src={item.mediaType === 'video' ? item.poster || item.image : item.image}
            alt={item.title || ''}
            loading="lazy"
            className="size-full object-cover"
          />
          {item.mediaType === 'video' ? (
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid size-12 place-items-center rounded-full border border-ivory/30 bg-ink/55 text-ivory backdrop-blur-sm">
                <Play size={16} strokeWidth={1.5} className="ml-0.5" fill="currentColor" />
              </span>
            </span>
          ) : null}
          <span className="scrim-soft absolute inset-x-0 bottom-0 p-3 text-left">
            <span className="block font-display text-sm font-semibold leading-tight text-ivory">
              {item.title}
            </span>
          </span>
        </button>
      ))}
    </div>
  )
}
