import { Pause, Play, Volume2, VolumeX } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from '../hooks/useUi'

/** True when the browser says the connection is metered or slow. */
function isFrugalConnection() {
  const connection = navigator.connection
  if (!connection) return false
  return Boolean(connection.saveData) || /2g/.test(connection.effectiveType ?? '')
}

/**
 * Ambient background video.
 *
 * The poster still is the real content here, the video is an enhancement laid
 * over it, and it is skipped entirely when the visitor has asked for reduced
 * motion, is on a metered connection, or is on a small screen where a
 * full-bleed autoplaying loop is mostly wasted bytes. It also pauses when
 * scrolled out of view, because decoding video nobody is looking at is the
 * quickest way to flatten a phone battery.
 */
export function BackgroundVideo({ src, poster, className = '', imageClassName = '' }) {
  const reducedMotion = usePrefersReducedMotion()
  const [shouldPlay, setShouldPlay] = useState(false)
  const videoRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!src || reducedMotion) {
      setShouldPlay(false)
      return
    }
    if (isFrugalConnection()) return
    if (window.matchMedia('(max-width: 767px)').matches) return

    // Let the poster paint first; the loop is never the priority.
    const timer = window.setTimeout(() => setShouldPlay(true), 600)
    return () => window.clearTimeout(timer)
  }, [src, reducedMotion])

  useEffect(() => {
    const video = videoRef.current
    const container = containerRef.current
    if (!shouldPlay || !video || !container) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => undefined)
        } else {
          video.pause()
        }
      },
      { threshold: 0.05 },
    )

    observer.observe(container)
    return () => observer.disconnect()
  }, [shouldPlay])

  return (
    <div ref={containerRef} className={`relative size-full ${className}`}>
      <img
        src={poster}
        alt=""
        fetchPriority="high"
        className={`absolute inset-0 size-full object-cover ${imageClassName}`}
      />

      {shouldPlay ? (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
          tabIndex={-1}
          className="absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-[1.5s]"
          onPlaying={(event) => {
            event.currentTarget.style.opacity = '1'
          }}
        />
      ) : null}
    </div>
  )
}

/**
 * Video the visitor chose to watch, a trailer, a showreel, a gallery clip.
 *
 * Unlike the background loop this one has sound and never autoplays: it waits
 * behind its poster until someone presses play, so a page full of media stays
 * silent until asked.
 */
export function FeatureVideo({
  src,
  poster,
  title = '',
  className = '',
  autoPlay = false,
  autoStart = false,
}) {
  const videoRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(autoPlay)
  const [hasStarted, setHasStarted] = useState(autoPlay || autoStart)

  const toggle = () => {
    const video = videoRef.current
    if (!video) return

    setHasStarted(true)
    if (video.paused) {
      video.play().catch(() => undefined)
    } else {
      video.pause()
    }
  }

  const toggleSound = () => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setIsMuted(video.muted)
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video || !autoPlay) return
    video.play().catch(() => undefined)
  }, [autoPlay])

  /**
   * Starts as soon as it mounts, for a clip opened by a click.
   *
   * That click is a user gesture, so sound is usually allowed. Some browsers
   * still refuse; rather than leave a silent, motionless frame, fall back to
   * playing muted and let the viewer turn the sound on.
   */
  useEffect(() => {
    const video = videoRef.current
    if (!video || !autoStart) return

    let cancelled = false

    video.muted = false
    video.play().catch(() => {
      if (cancelled) return
      video.muted = true
      setIsMuted(true)
      video.play().catch(() => undefined)
    })

    return () => {
      cancelled = true
      video.pause()
    }
  }, [autoStart, src])

  return (
    <div
      className={`group relative flex items-center justify-center overflow-hidden bg-ink-soft ${className}`}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        playsInline
        loop={autoPlay}
        muted={autoPlay}
        preload={autoPlay || autoStart ? 'auto' : 'none'}
        // Fit inside the box and stay centred on both axes. `size-full` would
        // force a portrait clip to the full width and crop the rest away,
        // which showed the ceiling and nothing else.
        className="max-h-full max-w-full object-contain"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={toggle}
      >
        {title ? <track kind="descriptions" label={title} /> : null}
      </video>

      {/* Big play affordance, until it has been started once. */}
      {!hasStarted ? (
        <button
          type="button"
          onClick={toggle}
          className="absolute inset-0 grid place-items-center bg-ink/35 transition-colors hover:bg-ink/20"
          aria-label={title ? `Play ${title}` : 'Play video'}
        >
          <span className="grid size-20 place-items-center rounded-full border border-ivory/30 bg-ink/60 text-ivory backdrop-blur-sm transition-transform duration-500 group-hover:scale-110">
            <Play size={26} strokeWidth={1.5} className="ml-1" fill="currentColor" />
          </span>
        </button>
      ) : (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-2 p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100 focus-within:opacity-100">
          <button
            type="button"
            onClick={toggle}
            className="pointer-events-auto grid size-11 place-items-center rounded-full border border-ivory/25 bg-ink/75 text-ivory backdrop-blur-sm transition hover:border-gold-lift hover:text-gold-lift"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause size={15} strokeWidth={1.5} />
            ) : (
              <Play size={15} strokeWidth={1.5} />
            )}
          </button>

          <button
            type="button"
            onClick={toggleSound}
            className="pointer-events-auto grid size-11 place-items-center rounded-full border border-ivory/25 bg-ink/75 text-ivory backdrop-blur-sm transition hover:border-gold-lift hover:text-gold-lift"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX size={15} strokeWidth={1.5} />
            ) : (
              <Volume2 size={15} strokeWidth={1.5} />
            )}
          </button>
        </div>
      )}
    </div>
  )
}
