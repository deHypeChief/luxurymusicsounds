import mongoose, { Schema, type Document, type Model } from 'mongoose'
import { BRANDS } from './Event.ts'

export interface ISocialLink {
  brand: string
  platform: string
  handle: string
  url: string
  sortOrder: number
}

export interface ISettings extends Document {
  key: string
  contact: { email: string; phone: string; city: string }
  footerHeading: string
  footerIntro: string
  socials: ISocialLink[]
}

const socialSchema = new Schema<ISocialLink>(
  {
    brand: { type: String, enum: BRANDS, default: 'Luxury Music Sounds' },
    platform: { type: String, required: true, trim: true },
    handle: { type: String, default: '', trim: true },
    url: { type: String, required: true, trim: true },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: true },
)

/**
 * One document holds the whole site's editable chrome. A settings *collection*
 * would imply there can be several sites; `key` is pinned to 'site' so there
 * is exactly one row and no ambiguity about which is live.
 */
const settingsSchema = new Schema<ISettings>(
  {
    key: { type: String, default: 'site', unique: true, immutable: true },

    contact: {
      email: { type: String, default: '', trim: true, lowercase: true },
      phone: { type: String, default: '', trim: true },
      city: { type: String, default: '', trim: true },
    },

    footerHeading: { type: String, default: 'Book the room', trim: true },
    footerIntro: { type: String, default: '', trim: true },

    socials: { type: [socialSchema], default: [] },
  },
  { timestamps: true },
)

export const DEFAULT_SETTINGS = {
  key: 'site',
  contact: {
    email: 'bookings@luxurymusicsounds.com',
    phone: '+234 800 000 0000',
    city: 'Lagos, Nigeria',
  },
  footerHeading: 'Book the room',
  footerIntro:
    'Weddings, private dinners, corporate evenings and concert programmes across Lagos and beyond. Tell us the room and the date, and we will tell you what it should sound like.',
  socials: [
    { brand: 'Luxury Music Sounds', platform: 'Instagram', handle: '@luxurymusicsounds', url: 'https://instagram.com/luxurymusicsounds', sortOrder: 10 },
    { brand: 'Easystrings', platform: 'Instagram', handle: '@easystrings', url: 'https://instagram.com/easystrings', sortOrder: 20 },
    { brand: 'Easystrings', platform: 'TikTok', handle: '@easystrings', url: 'https://tiktok.com/@easystrings', sortOrder: 21 },
    { brand: 'Easystrings', platform: 'Threads', handle: '@easystrings', url: 'https://threads.net/@easystrings', sortOrder: 22 },
    { brand: 'Easystrings', platform: 'Facebook', handle: 'Israel Peter', url: 'https://www.facebook.com/search/top?q=Israel%20Peter', sortOrder: 23 },
    { brand: 'The Four Seasons', platform: 'Instagram', handle: '@thefourseasons', url: 'https://instagram.com/thefourseasons', sortOrder: 30 },
    { brand: 'The Four Seasons', platform: 'TikTok', handle: '@thefourseasons', url: 'https://tiktok.com/@thefourseasons', sortOrder: 31 },
    { brand: 'The Four Seasons', platform: 'Facebook', handle: 'The Four Seasons', url: 'https://www.facebook.com/search/top?q=The%20Four%20Seasons', sortOrder: 32 },
  ],
}

export const Settings: Model<ISettings> =
  (mongoose.models.Settings as Model<ISettings>) ??
  mongoose.model<ISettings>('Settings', settingsSchema)

/** Reads the settings row, creating it from defaults the first time. */
export async function getSettings(): Promise<ISettings> {
  const existing = await Settings.findOne({ key: 'site' })
  if (existing) return existing

  return Settings.create(DEFAULT_SETTINGS)
}
