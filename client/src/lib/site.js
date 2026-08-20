/**
 * Site-wide content that is not editable from the admin panel: brand media,
 * the three acts and their socials, the founder story, and contact details.
 */

/**
 * Site-wide media, as opposed to the per-event media managed in the admin
 * panel. These are the two pieces that belong to the brand rather than to any
 * one evening, so they live in code and change about once a year.
 *
 * Drop the files into client/public/media/brand/ using exactly these names and
 * they appear. Leave a value as '' and that section falls back gracefully:
 * the hero shows its still photograph, and the showreel section is hidden
 * entirely rather than rendering an empty player.
 *
 * See client/public/media/README.md for the encoding settings.
 */
export const BRAND_MEDIA = {
  /**
   * The hero runs on a still. The client's clips are all phone video shot in
   * portrait, and cropping 1080x1920 down to a full-bleed landscape band throws
   * away the candles at the top and the audience at the bottom, which is most
   * of what makes them worth looking at. Drop a landscape clip in here and the
   * hero picks it up; leave it empty and the photograph carries the section.
   */
  heroVideo: '',
  heroPoster: '/media/four-seasons/ensemble-on-stage.jpg',

  /** Full-length performance piece for the About page. Keeps its sound. */
  showreel: '/media/luxury-music-sounds/full-house.mp4',
  showreelPoster: '/media/luxury-music-sounds/full-house.jpg',
  showreelTitle: 'A full house, from the back of the room',
  showreelCaption:
    'Filmed at a Luxury Music Sounds evening. The best answer to what one of these nights actually sounds like.',
}

/** Display order for the three acts, used wherever they are listed together. */
export const BRAND_ORDER = ['Luxury Music Sounds', 'Easystrings', 'The Four Seasons']

/**
 * The three acts.
 *
 * Names, roles and blurbs are editorial and live here. Social links do NOT:
 * they are edited in Admin > Settings, because they are the thing most likely
 * to change and the least likely to want a deploy.
 */
export const BRAND_PROFILES = [
  {
    id: 'luxury-music-sounds',
    name: 'Luxury Music Sounds',
    accent: 'royal',
    role: 'The house',
    blurb:
      'The parent house. Galas, corporate evenings and the season finale, with the roster playing together at full size.',
  },
  {
    id: 'easystrings',
    name: 'Easystrings',
    accent: 'velvet',
    role: 'Solo violin',
    blurb:
      'Israel Peter alone with a violin. Weddings, private dinners and the Velvet Sessions: fifty people, two sets, nothing amplified worth mentioning.',
  },
  {
    id: 'the-four-seasons',
    name: 'The Four Seasons',
    accent: 'gold',
    role: 'String ensemble',
    blurb:
      'The ensemble. Vivaldi by candlelight, the Advent concert, and the concert-hall programmes the house is known for.',
  },
]

export const FOUNDER = {
  name: 'Israel Peter',
  role: 'Founder & Lead Violin',
  portrait: '/media/easystrings/portrait.jpg',
  // PLACEHOLDER COPY, written to the right shape and length so the layout is
  // real, but every fact here needs replacing with Israel's own words.
  short:
    'Israel Peter started Easystrings with one violin and a diary of weddings. Luxury Music Sounds grew out of the evenings that diary could not hold.',
  paragraphs: [
    'Israel Peter started playing at ten, and started getting paid for it at nineteen. Weddings, mostly, then the receptions afterwards, then the dinners that followed the receptions. Easystrings was the name on the invoice before it was a name on a poster.',
    'What changed was the room. A solo violin can hold fifty people beautifully and five hundred people badly, and the bookings kept getting larger. So the ensemble came together: first a quartet, then a full string section, then The Four Seasons as a programme in its own right.',
    'Luxury Music Sounds is the house that holds all of it: the solo work, the ensemble, and the black-tie evenings where both play the same stage. The brief has not changed since the first wedding: put the audience close enough to hear the bow leave the string.',
  ],
  signature: 'Israel Peter',
}

export const NAV_LINKS = [
  { label: 'Events', to: '/events' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'About', to: '/about' },
]
