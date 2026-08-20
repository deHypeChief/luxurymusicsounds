/**
 * Seeds the owner account, the events, and the gallery.
 *
 *   bun run seed          # adds anything missing
 *   bun run seed --fresh  # wipes events/gallery/orders/tickets first
 *
 * Every image and clip below is the client's own, shipped from
 * client/public/media/. There are no stock placeholders left.
 */
import { env } from './config/env.ts'
import { slugify } from './lib/codes.ts'
import { connectDatabase, disconnectDatabase } from './lib/db.ts'
import { Admin, hashPassword } from './models/Admin.ts'
import { Event } from './models/Event.ts'
import { GalleryItem } from './models/GalleryItem.ts'
import { Order } from './models/Order.ts'
import { Ticket } from './models/Ticket.ts'

/** The Four Seasons: the ensemble on a concert stage. */
const FS = {
  ensemble: '/media/four-seasons/ensemble-on-stage.jpg',
  leadViolin: '/media/four-seasons/lead-violin.jpg',
  audience: '/media/four-seasons/audience-full-house.jpg',
  quintet: '/media/four-seasons/quintet-candlelight.jpg',
  stringsClose: '/media/four-seasons/strings-in-close.jpg',
}

/** Easystrings: Israel alone, in a room of candles. */
const ES = {
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
}

/**
 * Luxury Music Sounds.
 *
 * MISSING: the three photographs from this folder (the roster shot, and the two
 * wide candlelit hall frames) were lost and are not on disk. The entries below
 * stand in with Four Seasons images and stills pulled from the LMS clips. Once
 * the originals are back in client/public/media/luxury-music-sounds/, point
 * `house`, `hallWide` and `hallAudience` back at them and re-run the seed.
 */
const LMS = {
  house: '/media/luxury-music-sounds/full-house.jpg',
  hallWide: '/media/four-seasons/audience-full-house.jpg',
  hallAudience: '/media/four-seasons/strings-in-close.jpg',
  hallClip: '/media/luxury-music-sounds/candlelight-hall.mp4',
  hallClipPoster: '/media/luxury-music-sounds/candlelight-hall.jpg',
  ensembleClip: '/media/luxury-music-sounds/ensemble-live.mp4',
  ensembleClipPoster: '/media/luxury-music-sounds/ensemble-live.jpg',
  fullHouseClip: '/media/luxury-music-sounds/full-house.mp4',
  fullHouseClipPoster: '/media/luxury-music-sounds/full-house.jpg',
}

const daysFromNow = (days: number, hour = 19) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  date.setHours(hour, 0, 0, 0)
  return date
}

const eventSeeds = [
  {
    title: 'A Night of Strings',
    tagline: 'Vivaldi by candlelight, played by a full string section',
    description:
      'One evening, four movements, and a string ensemble at the very top of its craft. The Four Seasons returns to the concert hall with a candlelit reading of Vivaldi that moves from the first thaw of Spring to the hush of Winter. Expect a full string section, a grand piano, and an intermission served with champagne.\n\nDoors open an hour before the downbeat. Black tie is encouraged but never required. Come as the version of yourself that listens best.',
    brand: 'The Four Seasons',
    accent: 'gold',
    heroImage: FS.ensemble,
    posterImage: FS.leadViolin,
    gallery: [FS.quintet, FS.stringsClose, FS.audience, LMS.hallWide],
    venue: {
      name: 'Eko Convention Centre',
      address: 'Plot 1415 Adetokunbo Ademola Street, Victoria Island',
      city: 'Lagos',
      country: 'Nigeria',
    },
    startsAt: daysFromNow(34, 19),
    endsAt: daysFromNow(34, 23),
    doorsOpenAt: daysFromNow(34, 18),
    status: 'published',
    isHeadline: true,
    showPopup: true,
    sortOrder: 100,
    lineup: [
      { name: 'Israel Peter', role: 'Lead violin, Easystrings', image: ES.portrait },
      { name: 'The Four Seasons Ensemble', role: 'Strings', image: FS.stringsClose },
      { name: 'The Full Section', role: 'Strings and piano', image: FS.ensemble },
    ],
    tags: ['Classical', 'Candlelight', 'Black Tie'],
    ticketTypes: [
      {
        name: 'Balcony',
        description: 'Elevated seating with a full view of the ensemble.',
        price: 25000,
        quantity: 180,
        perOrderLimit: 6,
      },
      {
        name: 'Orchestra Floor',
        description: 'Centre seating, close enough to hear the rosin on the bow.',
        price: 55000,
        quantity: 120,
        perOrderLimit: 6,
      },
      {
        name: 'Gold Circle',
        description: 'Front two rows, champagne on arrival, and a post-show meet and greet.',
        price: 120000,
        quantity: 24,
        perOrderLimit: 4,
      },
    ],
  },
  {
    title: 'Velvet Sessions',
    tagline: 'One violin, fifty people, two sets',
    description:
      'Velvet Sessions strips everything back. A single violin, a room of fifty people, and a set list that runs from Afrobeat reworkings to the standards that started it all. Israel Peter plays two sets with a short interval, and the second is always where the room stops being an audience.\n\nSeating is at round tables of four. Small plates and cocktails are served throughout.',
    brand: 'Easystrings',
    accent: 'velvet',
    heroImage: ES.standing,
    posterImage: ES.seated,
    gallery: [ES.midPhrase, ES.profile, ES.candleRows, ES.atRest],
    trailerVideo: ES.clip,
    trailerPoster: ES.clipPoster,
    venue: {
      name: 'The Velvet Room',
      address: '14 Bourdillon Road, Ikoyi',
      city: 'Lagos',
      country: 'Nigeria',
    },
    startsAt: daysFromNow(12, 20),
    endsAt: daysFromNow(12, 23),
    doorsOpenAt: daysFromNow(12, 19),
    status: 'published',
    isHeadline: false,
    sortOrder: 80,
    lineup: [{ name: 'Israel Peter', role: 'Violin', image: ES.portrait }],
    tags: ['Intimate', 'Strings', 'Cocktails'],
    ticketTypes: [
      {
        name: 'Table Seat',
        description: 'One seat at a shared table of four.',
        price: 35000,
        quantity: 40,
        perOrderLimit: 4,
      },
      {
        name: 'Private Table',
        description: 'A full table of four with a dedicated host and bottle service.',
        price: 180000,
        quantity: 6,
        perOrderLimit: 2,
      },
    ],
  },
  {
    title: 'Luxury Nights: The Black Tie Gala',
    tagline: 'The season closes in blue and gold',
    description:
      'Our flagship evening. A twelve-piece band, a three-course dinner, and a dance floor that does not empty until the lights come up. Luxury Nights is where the whole roster plays together: Easystrings, The Four Seasons, and guests we announce on the night.\n\nStrict black tie. Tables of ten available for corporate bookings.',
    brand: 'Luxury Music Sounds',
    accent: 'royal',
    heroImage: LMS.hallWide,
    posterImage: LMS.house,
    gallery: [LMS.hallAudience, FS.ensemble, ES.fullFlight, FS.audience],
    trailerVideo: LMS.fullHouseClip,
    trailerPoster: LMS.fullHouseClipPoster,
    venue: {
      name: 'The Civic Centre',
      address: 'Ozumba Mbadiwe Avenue, Victoria Island',
      city: 'Lagos',
      country: 'Nigeria',
    },
    startsAt: daysFromNow(78, 19),
    endsAt: daysFromNow(79, 1),
    doorsOpenAt: daysFromNow(78, 18),
    status: 'published',
    isHeadline: false,
    sortOrder: 90,
    lineup: [
      { name: 'The Four Seasons Ensemble', role: 'Strings', image: FS.stringsClose },
      { name: 'Easystrings', role: 'Violin', image: ES.portrait },
      { name: 'The House', role: 'The full roster', image: LMS.house },
    ],
    tags: ['Gala', 'Dinner', 'Black Tie'],
    ticketTypes: [
      {
        name: 'Single Seat',
        description: 'One seat, three courses, and the full programme.',
        price: 95000,
        quantity: 200,
        perOrderLimit: 8,
      },
      {
        name: 'Table of Ten',
        description: 'A private table for ten with premium placement and wine service.',
        price: 900000,
        quantity: 12,
        perOrderLimit: 2,
      },
    ],
  },
  {
    title: 'Strings at Sunset',
    tagline: 'Golden hour, live strings, open sky',
    description:
      'A shorter, softer evening on the roof. The ensemble plays through sunset while the city switches its lights on below. Standing room with scattered lounge seating, and a bar that stays open an hour past the last note.',
    brand: 'Luxury Music Sounds',
    accent: 'gold',
    heroImage: ES.candleRows,
    posterImage: ES.bowRaised,
    gallery: [ES.standing, ES.midPhrase],
    venue: {
      name: 'Sky Terrace, Ikoyi',
      address: '3 Glover Road, Ikoyi',
      city: 'Lagos',
      country: 'Nigeria',
    },
    startsAt: daysFromNow(5, 17),
    endsAt: daysFromNow(5, 21),
    doorsOpenAt: daysFromNow(5, 16),
    status: 'published',
    isHeadline: false,
    sortOrder: 70,
    lineup: [{ name: 'Easystrings', role: 'Violin', image: ES.portrait }],
    tags: ['Rooftop', 'Sunset', 'Standing'],
    ticketTypes: [
      {
        name: 'General Admission',
        description: 'Standing room with access to the terrace bar.',
        price: 18000,
        quantity: 150,
        perOrderLimit: 10,
      },
      {
        name: 'Lounge Seat',
        description: 'A reserved lounge seat at the front of the terrace.',
        price: 45000,
        quantity: 30,
        perOrderLimit: 4,
      },
    ],
  },
  {
    title: 'The Advent Concert',
    tagline: 'Carols, candles, and a full string section',
    description:
      'Our December tradition. A programme of carols and quiet classics, played by candlelight to close out the year. Proceeds support music education across three Lagos schools.',
    brand: 'The Four Seasons',
    accent: 'royal',
    heroImage: FS.quintet,
    posterImage: FS.stringsClose,
    gallery: [FS.ensemble, FS.leadViolin],
    venue: {
      name: 'Cathedral Church of Christ',
      address: '29 Marina, Lagos Island',
      city: 'Lagos',
      country: 'Nigeria',
    },
    startsAt: daysFromNow(120, 18),
    endsAt: daysFromNow(120, 21),
    status: 'draft',
    isHeadline: false,
    sortOrder: 60,
    lineup: [{ name: 'The Four Seasons Ensemble', role: 'Strings', image: FS.stringsClose }],
    tags: ['Christmas', 'Charity', 'Candlelight'],
    ticketTypes: [
      {
        name: 'Open Seating',
        description: 'Unreserved seating throughout the nave.',
        price: 15000,
        quantity: 300,
        perOrderLimit: 10,
      },
    ],
  },
  {
    title: 'The Garden Concert',
    tagline: 'Where the season began',
    description:
      'An afternoon with the full ensemble, played to a room that filled long before the downbeat. This one has already happened. The photographs are in the gallery.',
    brand: 'The Four Seasons',
    accent: 'gold',
    heroImage: FS.audience,
    posterImage: FS.audience,
    gallery: [FS.ensemble, FS.quintet, FS.leadViolin],
    venue: {
      name: 'Lekki Conservation Centre',
      address: 'Lekki Peninsula II',
      city: 'Lagos',
      country: 'Nigeria',
    },
    startsAt: daysFromNow(-46, 16),
    endsAt: daysFromNow(-46, 20),
    status: 'published',
    isHeadline: false,
    sortOrder: 10,
    lineup: [{ name: 'The Four Seasons Ensemble', role: 'Strings', image: FS.stringsClose }],
    tags: ['Ensemble', 'Daytime'],
    ticketTypes: [
      { name: 'Open Seating', description: 'Unreserved.', price: 12000, quantity: 250 },
    ],
  },
]

interface GallerySeed {
  image: string
  title: string
  caption: string
  brand: string
  category: string
  orientation: 'portrait' | 'landscape' | 'square'
  featured?: boolean
  mediaType?: 'image' | 'video'
  poster?: string
}

const gallerySeeds: GallerySeed[] = [
  // The Four Seasons
  { image: FS.ensemble, title: 'The full section', caption: 'Strings, piano and voice, mid-programme', brand: 'The Four Seasons', category: 'Performances', orientation: 'landscape', featured: true },
  { image: FS.audience, title: 'A full house', caption: 'The room, three movements in', brand: 'The Four Seasons', category: 'Performances', orientation: 'landscape', featured: true },
  { image: FS.quintet, title: 'By candlelight', caption: 'The quintet, flowers along the stage front', brand: 'The Four Seasons', category: 'Performances', orientation: 'landscape' },
  { image: FS.leadViolin, title: 'Lead violin', caption: 'From behind the section', brand: 'The Four Seasons', category: 'Performances', orientation: 'portrait', featured: true },
  { image: FS.stringsClose, title: 'In close', caption: 'The bow, an inch off the string', brand: 'The Four Seasons', category: 'Details', orientation: 'portrait' },

  // Easystrings
  { image: ES.portrait, title: 'Israel Peter', caption: 'Founder and lead violin', brand: 'Easystrings', category: 'Portraits', orientation: 'portrait', featured: true },
  { image: ES.standing, title: 'Standing', caption: 'A room built entirely from candles', brand: 'Easystrings', category: 'Performances', orientation: 'portrait', featured: true },
  { image: ES.midPhrase, title: 'Mid phrase', caption: 'The part of the set he enjoys most', brand: 'Easystrings', category: 'Performances', orientation: 'portrait' },
  { image: ES.seated, title: 'Seated', caption: 'Second set, closer in', brand: 'Easystrings', category: 'Performances', orientation: 'portrait' },
  { image: ES.profile, title: 'In profile', caption: 'Candlelight does the lighting design', brand: 'Easystrings', category: 'Performances', orientation: 'portrait' },
  { image: ES.bowRaised, title: 'Bow raised', caption: 'The half second before the first note', brand: 'Easystrings', category: 'Details', orientation: 'portrait' },
  { image: ES.candleRows, title: 'Candle rows', caption: 'Every one of them lit by hand', brand: 'Easystrings', category: 'Venues', orientation: 'portrait' },
  { image: ES.fullFlight, title: 'Full flight', caption: 'Nothing amplified worth mentioning', brand: 'Easystrings', category: 'Performances', orientation: 'portrait' },
  { image: ES.atRest, title: 'At rest', caption: 'Between sets', brand: 'Easystrings', category: 'Portraits', orientation: 'portrait' },

  // Luxury Music Sounds

  // Clips
  { image: ES.clip, poster: ES.clipPoster, mediaType: 'video', title: 'The candlelight set', caption: 'Easystrings, live', brand: 'Easystrings', category: 'Performances', orientation: 'portrait', featured: true },
  { image: LMS.hallClip, poster: LMS.hallClipPoster, mediaType: 'video', title: 'Inside the hall', caption: 'The room as it fills', brand: 'Luxury Music Sounds', category: 'Venues', orientation: 'portrait' },
  { image: LMS.ensembleClip, poster: LMS.ensembleClipPoster, mediaType: 'video', title: 'The ensemble, live', caption: 'Strings at full size', brand: 'Luxury Music Sounds', category: 'Performances', orientation: 'portrait', featured: true },
  { image: LMS.fullHouseClip, poster: LMS.fullHouseClipPoster, mediaType: 'video', title: 'A full house', caption: 'From the back of the room', brand: 'Luxury Music Sounds', category: 'Performances', orientation: 'portrait' },
]

async function seedAdmin() {
  const email = env.seed.adminEmail.toLowerCase()
  const existing = await Admin.findOne({ email })

  if (existing) {
    console.log(`[seed] owner account already exists: ${email}`)
    return
  }

  await Admin.create({
    name: env.seed.adminName,
    email,
    passwordHash: await hashPassword(env.seed.adminPassword),
    role: 'owner',
  })

  console.log(`[seed] created owner account ${email}`)
  console.log(`[seed] password: ${env.seed.adminPassword}  <- change this after first sign in`)
}

async function seedEvents() {
  for (const seed of eventSeeds) {
    const slug = slugify(seed.title)
    const existing = await Event.findOne({ slug })

    if (existing) {
      console.log(`[seed] skipping existing event: ${seed.title}`)
      continue
    }

    await Event.create({ ...seed, slug })
    console.log(`[seed] created event: ${seed.title}`)
  }
}

async function seedGallery() {
  const count = await GalleryItem.countDocuments({})
  if (count > 0) {
    console.log(`[seed] gallery already has ${count} item(s), leaving it alone`)
    return
  }

  await GalleryItem.insertMany(
    gallerySeeds.map((item, index) => ({
      ...item,
      mediaType: item.mediaType ?? 'image',
      poster: item.poster ?? '',
      sortOrder: gallerySeeds.length - index,
      isPublished: true,
    })),
  )

  console.log(`[seed] created ${gallerySeeds.length} gallery items`)
}

async function run() {
  const fresh = process.argv.includes('--fresh')

  await connectDatabase()

  if (fresh) {
    console.log('[seed] --fresh: clearing events, gallery, orders and tickets')
    await Promise.all([
      Event.deleteMany({}),
      GalleryItem.deleteMany({}),
      Order.deleteMany({}),
      Ticket.deleteMany({}),
    ])
  }

  await seedAdmin()
  await seedEvents()
  await seedGallery()

  await disconnectDatabase()
  console.log('[seed] done')
}

run().catch((error) => {
  console.error('[seed] failed:', error)
  process.exit(1)
})
