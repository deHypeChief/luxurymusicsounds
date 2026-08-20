import { useEffect, useMemo, useRef, useState } from 'react'
import { usePrefersReducedMotion } from '../../hooks/useUi'
import { galleryItems } from '../../content/gallery'

/**
 * The strip of work under "Photographs from the season".
 *
 * Desktop gets an endless marquee of stills and clips that drifts on its own.
 * The track is rendered twice and translated by exactly half its width, so the
 * loop point lands on an identical frame and there is no visible jump.
 *
 * Phones get something else entirely: one full-width photograph crossfading to
 * the next. A sideways marquee on a narrow screen shows one and a half tiles
 * and fights the page scroll, and autoplaying video on a phone is bandwidth
 * most visitors did not agree to spend.
 */

/** Deterministic shuffle: the order varies per load without a hydration clash. */
function shuffled(list, seed) {
  const copy = [...list]
  let random = seed

  for (let i = copy.length - 1; i > 0; i -= 1) {
    random = (random * 1664525 + 1013904223) % 4294967296
    const j = random % (i + 1)
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }

  return copy
}

const MOBILE_INTERVAL_MS = 4200

export default function MediaMarquee() {
  const reducedMotion = usePrefersReducedMotion()

  // One shuffle per mount, so the strip is not identical on every visit.
  const [seed] = useState(() => Math.floor(Math.random() * 1_000_000))

  const desktopItems = useMemo(() => shuffled(galleryItems, seed), [seed])

  const stills = useMemo(
    () => shuffled(galleryItems.filter((item) => item.mediaType !== 'video'), seed + 7),
    [seed],
  )

  return (
    <>
      <div className="hidden md:block">
        <Marquee items={desktopItems} paused={reducedMotion} />
      </div>

      <div className="md:hidden">
        <Fader items={stills} still={reducedMotion} />
      </div>
    </>
  )
}

function Marquee({ items, paused }) {
  const trackRef = useRef(null)
  const [isHovered, setIsHovered] = useState(false)

  // Two identical passes make the wrap invisible; the animation moves the track
  // by 50%, which lands the second pass exactly where the first started.
  const track = [...items, ...items]

  return (
    <div
      className="group relative overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        ref={trackRef}
        className="flex w-max gap-4"
        style={{
          animation: paused ? 'none' : 'marquee 90s linear infinite',
          animationPlayState: isHovered ? 'paused' : 'running',
        }}
      >
        {track.map((item, index) => (
          <MarqueeTile key={`${item.id}-${index}`} item={item} />
        ))}
      </div>

      {/* The strip fades out at both edges rather than being cut off. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-ink to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-ink to-transparent" />
    </div>
  )
}

function MarqueeTile({ item }) {
  const videoRef = useRef(null)
  const isVideo = item.mediaType === 'video'

  // Clips play silently in the strip. Only load them once they are near.
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => undefined)
        else video.pause()
      },
      { threshold: 0.1 },
    )

    observer.observe(video)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="relative h-64 w-52 shrink-0 overflow-hidden bg-ink-soft md:h-80 md:w-64">
      {isVideo ? (
        <video
          ref={videoRef}
          src={item.image}
          poster={item.poster}
          muted
          loop
          playsInline
          preload="none"
          aria-label={item.title}
          className="size-full object-cover"
        />
      ) : (
        <img
          src={item.image}
          alt={item.title || ''}
          loading="lazy"
          draggable={false}
          className="size-full object-cover"
        />
      )}

      <div className="scrim-soft pointer-events-none absolute inset-x-0 bottom-0 p-4">
        <p className="font-display text-lg leading-tight text-ivory">{item.title}</p>
      </div>
    </div>
  )
}

/** One full-width photograph at a time, crossfading to the next. */
function Fader({ items, still }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (still || items.length < 2) return

    const timer = setInterval(
      () => setIndex((current) => (current + 1) % items.length),
      MOBILE_INTERVAL_MS,
    )
    return () => clearInterval(timer)
  }, [still, items.length])

  if (items.length === 0) return null

  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden bg-ink-soft">
      {items.map((item, position) => (
        <img
          key={item.id}
          src={item.image}
          alt={position === index ? item.title || '' : ''}
          aria-hidden={position !== index}
          loading={position === 0 ? 'eager' : 'lazy'}
          className="absolute inset-0 size-full object-cover transition-opacity duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ opacity: position === index ? 1 : 0 }}
        />
      ))}

      <div className="scrim-soft pointer-events-none absolute inset-x-0 bottom-0 p-5">
        <p className="font-display text-xl leading-tight text-ivory">{items[index].title}</p>
        {items[index].caption ? (
          <p className="mt-1 text-sm text-ivory-dim">{items[index].caption}</p>
        ) : null}
      </div>
    </div>
  )
}
