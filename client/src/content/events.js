/**
 * The events.
 *
 * THIS IS THE FILE YOU EDIT TO PUT AN EVENT ON THE SITE.
 *
 * Tickets are sold by Paystack, not by this site. For each event you create a
 * Payment Page in the Paystack dashboard, add one product per ticket tier with
 * a stock count, and paste the page's URL in as `ticketsUrl`. Paystack then
 * owns the price and the inventory, takes the payment, emails the receipt, and
 * closes the tier off with "Out of Stock" when the last one sells.
 *
 * How to add an event:
 *   1. Paystack dashboard > Payment Pages > New Page.
 *   2. Add a product per tier (Balcony, Gold Circle, ...) with a stock number.
 *   3. Set the page's redirect URL to https://<your-domain>/thank-you
 *   4. Copy the page link and add an entry below.
 *
 * CAREFUL: the prices below are for display only. They are not what anyone is
 * charged, Paystack is. If you change a price, change it in both places or the
 * site will advertise one number and charge another.
 *
 * `status`: 'published' shows it, 'draft' hides it entirely.
 */

const M = {
  fs: {
    ensemble: '/media/four-seasons/ensemble-on-stage.jpg',
    leadViolin: '/media/four-seasons/lead-violin.jpg',
    audience: '/media/four-seasons/audience-full-house.jpg',
    quintet: '/media/four-seasons/quintet-candlelight.jpg',
    stringsClose: '/media/four-seasons/strings-in-close.jpg',
  },
  es: {
    seated: '/media/easystrings/seated-playing.jpg',
    midPhrase: '/media/easystrings/mid-phrase.jpg',
    profile: '/media/easystrings/profile-in-candlelight.jpg',
    portrait: '/media/easystrings/portrait.jpg',
    standing: '/media/easystrings/standing-wide.jpg',
    bowRaised: '/media/easystrings/bow-raised.jpg',
    candleRows: '/media/easystrings/candle-rows.jpg',
    fullFlight: '/media/easystrings/full-flight.jpg',
    atRest: '/media/easystrings/violin-at-rest.jpg',
    clip: '/media/easystrings/candlelight-set.mp4',
    clipPoster: '/media/easystrings/candlelight-set.jpg',
  },
  lms: {
    fullHouseClip: '/media/luxury-music-sounds/full-house.mp4',
    fullHousePoster: '/media/luxury-music-sounds/full-house.jpg',
  },
}

export const EVENTS = [
  {
    slug: 'a-night-of-strings',
    title: 'A Night of Strings',
    tagline: 'Vivaldi by candlelight, played by a full string section',
    brand: 'The Four Seasons',
    accent: 'gold',
    status: 'published',

    /** The headline event. Gets the home page feature and the buy dialog. */
    isHeadline: true,
    showPopup: true,

    startsAt: '2026-09-23T19:00:00+01:00',
    endsAt: '2026-09-23T23:00:00+01:00',
    doorsOpenAt: '2026-09-23T18:00:00+01:00',

    venue: {
      name: 'Eko Convention Centre',
      address: 'Plot 1415 Adetokunbo Ademola Street, Victoria Island',
      city: 'Lagos',
      country: 'Nigeria',
    },

    // TODO: replace with the real Paystack Payment Page link.
    ticketsUrl: 'https://paystack.com/pay/lms-a-night-of-strings',

    description:
      'One evening, four movements, and a string ensemble at the very top of its craft. The Four Seasons returns to the concert hall with a candlelit reading of Vivaldi that moves from the first thaw of Spring to the hush of Winter. Expect a full string section, a grand piano, and an intermission served with champagne.\n\nDoors open an hour before the downbeat. Black tie is encouraged but never required. Come as the version of yourself that listens best.',

    heroImage: M.fs.ensemble,
    posterImage: M.fs.leadViolin,
    gallery: [M.fs.quintet, M.fs.stringsClose, M.fs.audience],

    lineup: [
      { name: 'Israel Peter', role: 'Lead violin, Easystrings', image: M.es.portrait },
      { name: 'The Four Seasons Ensemble', role: 'Strings', image: M.fs.stringsClose },
      { name: 'The Full Section', role: 'Strings and piano', image: M.fs.ensemble },
    ],
    tags: ['Classical', 'Candlelight', 'Black Tie'],

    ticketTypes: [
      { name: 'Balcony', price: 25000, description: 'Elevated seating with a full view of the ensemble.' },
      { name: 'Orchestra Floor', price: 55000, description: 'Centre seating, close enough to hear the rosin on the bow.' },
      { name: 'Gold Circle', price: 120000, description: 'Front two rows, champagne on arrival, and a post-show meet and greet.' },
    ],
  },

  {
    slug: 'strings-at-sunset',
    title: 'Strings at Sunset',
    tagline: 'Golden hour, live strings, open sky',
    brand: 'Luxury Music Sounds',
    accent: 'gold',
    status: 'draft', // hidden for now; set back to 'published' to list it again

    startsAt: '2026-08-25T17:00:00+01:00',
    endsAt: '2026-08-25T21:00:00+01:00',
    doorsOpenAt: '2026-08-25T16:00:00+01:00',

    venue: {
      name: 'Sky Terrace, Ikoyi',
      address: '3 Glover Road, Ikoyi',
      city: 'Lagos',
      country: 'Nigeria',
    },

    ticketsUrl: 'https://paystack.com/pay/lms-strings-at-sunset',

    description:
      'A shorter, softer evening on the roof. The ensemble plays through sunset while the city switches its lights on below. Standing room with scattered lounge seating, and a bar that stays open an hour past the last note.',

    heroImage: M.es.candleRows,
    posterImage: M.es.bowRaised,
    gallery: [M.es.standing, M.es.midPhrase],

    lineup: [{ name: 'Easystrings', role: 'Violin', image: M.es.portrait }],
    tags: ['Rooftop', 'Sunset', 'Standing'],

    ticketTypes: [
      { name: 'General Admission', price: 18000, description: 'Standing room with access to the terrace bar.' },
      { name: 'Lounge Seat', price: 45000, description: 'A reserved lounge seat at the front of the terrace.' },
    ],
  },

  {
    slug: 'velvet-sessions',
    title: 'Velvet Sessions',
    tagline: 'One violin, fifty people, two sets',
    brand: 'Easystrings',
    accent: 'velvet',
    status: 'draft', // hidden for now; set back to 'published' to list it again

    startsAt: '2026-09-01T20:00:00+01:00',
    endsAt: '2026-09-01T23:00:00+01:00',
    doorsOpenAt: '2026-09-01T19:00:00+01:00',

    venue: {
      name: 'The Velvet Room',
      address: '14 Bourdillon Road, Ikoyi',
      city: 'Lagos',
      country: 'Nigeria',
    },

    ticketsUrl: 'https://paystack.com/pay/lms-velvet-sessions',

    description:
      'Velvet Sessions strips everything back. A single violin, a room of fifty people, and a set list that runs from Afrobeat reworkings to the standards that started it all. Israel Peter plays two sets with a short interval, and the second is always where the room stops being an audience.\n\nSeating is at round tables of four. Small plates and cocktails are served throughout.',

    heroImage: M.es.standing,
    posterImage: M.es.seated,
    gallery: [M.es.midPhrase, M.es.profile, M.es.candleRows, M.es.atRest],
    trailerVideo: M.es.clip,
    trailerPoster: M.es.clipPoster,

    lineup: [{ name: 'Israel Peter', role: 'Violin', image: M.es.portrait }],
    tags: ['Intimate', 'Strings', 'Cocktails'],

    ticketTypes: [
      { name: 'Table Seat', price: 35000, description: 'One seat at a shared table of four.' },
      { name: 'Private Table', price: 180000, description: 'A full table of four with a dedicated host and bottle service.' },
    ],
  },

  {
    slug: 'luxury-nights-the-black-tie-gala',
    title: 'Luxury Nights: The Black Tie Gala',
    tagline: 'The season closes in blue and gold',
    brand: 'Luxury Music Sounds',
    accent: 'royal',
    status: 'published',

    startsAt: '2026-11-06T19:00:00+01:00',
    endsAt: '2026-11-07T01:00:00+01:00',
    doorsOpenAt: '2026-11-06T18:00:00+01:00',

    venue: {
      name: 'The Civic Centre',
      address: 'Ozumba Mbadiwe Avenue, Victoria Island',
      city: 'Lagos',
      country: 'Nigeria',
    },

    ticketsUrl: 'https://paystack.com/pay/lms-black-tie-gala',

    description:
      'Our flagship evening. A twelve-piece band, a three-course dinner, and a dance floor that does not empty until the lights come up. Luxury Nights is where the whole roster plays together: Easystrings, The Four Seasons, and guests we announce on the night.\n\nStrict black tie. Tables of ten available for corporate bookings.',

    heroImage: M.fs.audience,
    posterImage: M.fs.leadViolin,
    gallery: [M.fs.ensemble, M.es.fullFlight, M.fs.quintet],
    trailerVideo: M.lms.fullHouseClip,
    trailerPoster: M.lms.fullHousePoster,

    lineup: [
      { name: 'The Four Seasons Ensemble', role: 'Strings', image: M.fs.stringsClose },
      { name: 'Easystrings', role: 'Violin', image: M.es.portrait },
      { name: 'The House', role: 'The full roster', image: M.lms.fullHousePoster },
    ],
    tags: ['Gala', 'Dinner', 'Black Tie'],

    ticketTypes: [
      { name: 'Single Seat', price: 95000, description: 'One seat, three courses, and the full programme.' },
      { name: 'Table of Ten', price: 900000, description: 'A private table for ten with premium placement and wine service.' },
    ],
  },

  {
    slug: 'the-advent-concert',
    title: 'The Advent Concert',
    tagline: 'Carols, candles, and a full string section',
    brand: 'The Four Seasons',
    accent: 'royal',
    // Not announced yet. Flip to 'published' and add a ticketsUrl to open it up.
    status: 'draft',

    startsAt: '2026-12-18T18:00:00+01:00',
    endsAt: '2026-12-18T21:00:00+01:00',

    venue: {
      name: 'Cathedral Church of Christ',
      address: '29 Marina, Lagos Island',
      city: 'Lagos',
      country: 'Nigeria',
    },

    ticketsUrl: '',

    description:
      'Our December tradition. A programme of carols and quiet classics, played by candlelight to close out the year. Proceeds support music education across three Lagos schools.',

    heroImage: M.fs.quintet,
    posterImage: M.fs.stringsClose,
    gallery: [M.fs.ensemble, M.fs.leadViolin],

    lineup: [{ name: 'The Four Seasons Ensemble', role: 'Strings', image: M.fs.stringsClose }],
    tags: ['Christmas', 'Charity', 'Candlelight'],

    ticketTypes: [
      { name: 'Open Seating', price: 15000, description: 'Unreserved seating throughout the nave.' },
    ],
  },

  {
    slug: 'the-garden-concert',
    title: 'The Garden Concert',
    tagline: 'Where the season began',
    brand: 'The Four Seasons',
    accent: 'gold',
    status: 'published',

    startsAt: '2026-07-05T16:00:00+01:00',
    endsAt: '2026-07-05T20:00:00+01:00',

    venue: {
      name: 'Lekki Conservation Centre',
      address: 'Lekki Peninsula II',
      city: 'Lagos',
      country: 'Nigeria',
    },

    ticketsUrl: '',

    description:
      'An afternoon with the full ensemble, played to a room that filled long before the downbeat. This one has already happened. The photographs are in the gallery.',

    heroImage: M.fs.audience,
    posterImage: M.fs.audience,
    gallery: [M.fs.ensemble, M.fs.quintet, M.fs.leadViolin],

    lineup: [{ name: 'The Four Seasons Ensemble', role: 'Strings', image: M.fs.stringsClose }],
    tags: ['Ensemble', 'Daytime'],

    ticketTypes: [
      { name: 'Open Seating', price: 12000, description: 'Unreserved.' },
    ],
  },
]

/* --- derived helpers ------------------------------------------------------ */

const isPast = (event) => new Date(event.endsAt ?? event.startsAt).getTime() < Date.now()

/** Everything the public should see, soonest first. */
export function publishedEvents({ scope = 'upcoming', brand } = {}) {
  return EVENTS.filter((event) => {
    if (event.status !== 'published') return false
    if (brand && brand !== 'all' && event.brand !== brand) return false
    if (scope === 'upcoming') return !isPast(event)
    if (scope === 'past') return isPast(event)
    return true
  })
    .map(decorate)
    .sort((a, b) =>
      scope === 'past'
        ? new Date(b.startsAt) - new Date(a.startsAt)
        : new Date(a.startsAt) - new Date(b.startsAt),
    )
}

export function findEvent(slug) {
  const event = EVENTS.find((item) => item.slug === slug && item.status === 'published')
  return event ? decorate(event) : null
}

/** The event that takes the home page feature, falling back to the soonest. */
export function headlineEvent() {
  const upcoming = publishedEvents({ scope: 'upcoming' })
  return upcoming.find((event) => event.isHeadline) ?? upcoming[0] ?? null
}

/** Adds the fields the UI reads, so components stay unaware of the shape. */
function decorate(event) {
  const past = isPast(event)
  const prices = (event.ticketTypes ?? []).map((tier) => tier.price)

  return {
    ...event,
    id: event.slug,
    isPast: past,
    // Stock lives in Paystack, so the only thing this site can honestly say is
    // whether the date has passed and whether a page exists to buy from.
    ticketsOnSale: !past && Boolean(event.ticketsUrl),
    lowestPrice: prices.length > 0 ? Math.min(...prices) : null,
    ticketTypes: (event.ticketTypes ?? []).map((tier, index) => ({
      ...tier,
      id: `${event.slug}-${index}`,
    })),
  }
}
