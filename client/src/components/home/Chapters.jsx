import { Link } from 'react-router-dom'
import Reveal from '../Reveal'
import { Movement, Script } from '../Typography'

/**
 * Three photographs given room to breathe, each with the part of the house it
 * actually stands for.
 *
 * These are the client's own images and they are the strongest thing on the
 * site, so they are shown at close to full width rather than cropped into a
 * card. The copy is doing a job here: it names what the picture is evidence of,
 * which is the difference between a gallery and an argument.
 */
const CHAPTERS = [
  {
    eyebrow: 'Easystrings',
    image: '/media/easystrings/standing-wide.jpg',
    // Phones get the clip instead. It was shot in portrait, which is the wrong
    // shape for the wide desktop column but exactly right on a phone.
    mobileVideo: '/media/luxury-music-sounds/full-house.mp4',
    mobileVideoPoster: '/media/luxury-music-sounds/full-house.jpg',
    alt: 'Israel Peter playing violin in a room lined with hundreds of candles',
    heading: ['One violin, and a room built from', 'candlelight'],
    body: 'No amplification worth mentioning, and nothing between the bow and the back row. Every one of those candles is placed by hand before doors, because the light is part of the arrangement. This is what an Easystrings evening is: small, close, and lit so that the only thing competing with the music is the flicker.',
    link: { to: '/events', label: 'See the Easystrings dates' },
  },
  {
    eyebrow: 'The Four Seasons',
    image: '/media/four-seasons/ensemble-on-stage.jpg',
    alt: 'The Four Seasons ensemble on a concert stage with grand piano and cellos',
    heading: ['A full section, rehearsed all', 'year'],
    body: 'Strings, a grand piano, and players who work together long enough to breathe in the same places. A Four Seasons programme is not a collection of diaries that happened to align on a Saturday. It is the reason the phrasing lands as one instrument rather than seven.',
    link: { to: '/events', label: 'See the concert programmes' },
    flip: true,
  },
  {
    eyebrow: 'Luxury Music Sounds',
    image: '/media/four-seasons/audience-full-house.jpg',
    alt: 'A candlelit concert hall with a string ensemble and a full seated audience',
    heading: ['And then the room goes', 'quiet'],
    body: 'This is the moment the whole house is built around, and the only one that cannot be rehearsed. A hall this size, banked floor to ceiling with candles, several hundred people, and the half second before the first note when nobody is talking. Everything else we do is in service of getting a room to that.',
    link: { to: '/gallery', label: 'Open the full archive' },
  },
]

export default function Chapters() {
  return (
    <section className="border-t border-ink-line py-20 md:py-28">
      <div className="shell">
        <Reveal>
          <Movement label="What an evening looks like" />
        </Reveal>
      </div>

      <div className="mt-14 space-y-20 md:space-y-32">
        {CHAPTERS.map((chapter, index) => (
          <article key={chapter.eyebrow}>
            <div
              className={`shell grid items-center gap-8 lg:gap-16 ${
                chapter.flip
                  ? 'lg:grid-cols-[0.85fr_1.15fr]'
                  : 'lg:grid-cols-[1.15fr_0.85fr]'
              }`}
            >
              <Reveal
                delay={0.05}
                className={chapter.flip ? 'lg:order-2' : ''}
              >
                <div className="relative aspect-[4/3] overflow-hidden lg:aspect-[3/2]">
                  {chapter.mobileVideo ? (
                    <video
                      src={chapter.mobileVideo}
                      poster={chapter.mobileVideoPoster}
                      muted
                      loop
                      autoPlay
                      playsInline
                      aria-label={chapter.alt}
                      className="size-full object-cover lg:hidden"
                    />
                  ) : null}

                  <img
                    src={chapter.image}
                    alt={chapter.alt}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    className={`size-full object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.04] ${
                      chapter.mobileVideo ? 'hidden lg:block' : ''
                    }`}
                  />
                  <div className="scrim-soft pointer-events-none absolute inset-0 opacity-60" />
                </div>
              </Reveal>

              <Reveal delay={0.12} className={chapter.flip ? 'lg:order-1' : ''}>
                <p className="u-eyebrow">{chapter.eyebrow}</p>

                <h3 className="u-display mt-4 text-[length:var(--text-title)]">
                  {chapter.heading[0]} <Script xl>{chapter.heading[1]}</Script>
                </h3>

                <p className="mt-6 text-lg leading-relaxed text-ivory-dim">{chapter.body}</p>

                <Link
                  to={chapter.link.to}
                  className="u-meta mt-8 inline-block transition-colors hover:text-gold-lift"
                >
                  {chapter.link.label}
                </Link>
              </Reveal>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
