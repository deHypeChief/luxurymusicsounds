/**
 * Everything about the house that is not an event or a photograph.
 *
 * Contact details, social links, the founder story and the site-wide media all
 * live here. Edit this file and redeploy; there is no admin panel and nothing
 * is stored on a server.
 */

/* --- Contact -------------------------------------------------------------- */

export const CONTACT = {
  email: 'bookings@luxurymusicsounds.com',
  phone: '+234 800 000 0000',
  city: 'Lagos, Nigeria',
}

export const FOOTER = {
  /** The last word is set in the gold script face, so put the emphasis there. */
  heading: 'Book the room',
  intro:
    'Weddings, private dinners, corporate evenings and concert programmes across Lagos and beyond. Tell us the room and the date, and we will tell you what it should sound like.',
}

/* --- Site-wide media ------------------------------------------------------ */

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

/* --- The three acts ------------------------------------------------------- */

/** Display order wherever the acts are listed together. */
export const BRAND_ORDER = ['Luxury Music Sounds', 'Easystrings', 'The Four Seasons']

/**
 * SOCIAL LINKS: please confirm each one resolves before launch.
 *
 * The brief gave display names rather than URLs. Where a platform uses
 * unambiguous handles (Instagram, TikTok, Threads) the handle below is a best
 * guess from that name. Where only a page name was given (both Facebook
 * entries) the link runs a Facebook search for that name, which always
 * resolves, rather than guessing a vanity URL that might 404.
 */
const facebookSearch = (name) =>
  `https://www.facebook.com/search/top?q=${encodeURIComponent(name)}`

export const BRAND_PROFILES = [
  {
    id: 'luxury-music-sounds',
    name: 'Luxury Music Sounds',
    accent: 'royal',
    role: 'The house',
    blurb:
      'The parent house. Galas, corporate evenings and the season finale, with the roster playing together at full size.',
    socials: [
      { platform: 'Instagram', handle: '@luxurymusicsounds', url: 'https://instagram.com/luxurymusicsounds' },
    ],
  },
  {
    id: 'easystrings',
    name: 'Easystrings',
    accent: 'velvet',
    role: 'Solo violin',
    blurb:
      'Israel Peter alone with a violin. Weddings, private dinners and the Velvet Sessions: fifty people, two sets, nothing amplified worth mentioning.',
    socials: [
      { platform: 'Instagram', handle: '@easystrings', url: 'https://instagram.com/easystrings' },
      { platform: 'TikTok', handle: '@easystrings', url: 'https://tiktok.com/@easystrings' },
      { platform: 'Threads', handle: '@easystrings', url: 'https://threads.net/@easystrings' },
      { platform: 'Facebook', handle: 'Israel Peter', url: facebookSearch('Israel Peter') },
    ],
  },
  {
    id: 'the-four-seasons',
    name: 'The Four Seasons',
    accent: 'gold',
    role: 'String ensemble',
    blurb:
      'The ensemble. Vivaldi by candlelight, the Advent concert, and the concert-hall programmes the house is known for.',
    socials: [
      { platform: 'Instagram', handle: '@thefourseasons', url: 'https://instagram.com/thefourseasons' },
      { platform: 'TikTok', handle: '@thefourseasons', url: 'https://tiktok.com/@thefourseasons' },
      { platform: 'Facebook', handle: 'The Four Seasons', url: facebookSearch('The Four Seasons') },
    ],
  },
]

export const socialsFor = (brand) =>
  BRAND_PROFILES.find((profile) => profile.name === brand)?.socials ?? []

/* --- The founder ---------------------------------------------------------- */

export const FOUNDER = {
  name: 'Israel Peter',
  role: 'Founder & Lead Violin',
  portrait: '/media/easystrings/portrait.jpg',
  // PLACEHOLDER COPY: written to the right shape and length so the layout is
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

/* --- Navigation ----------------------------------------------------------- */

export const NAV_LINKS = [
  { label: 'Events', to: '/events' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'About', to: '/about' },
]
