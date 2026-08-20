import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose'

export const BRANDS = ['Luxury Music Sounds', 'Easystrings', 'The Four Seasons'] as const
export type Brand = (typeof BRANDS)[number]

/** Drives which brand colour an event card wears on the front end. */
export const ACCENTS = ['gold', 'royal', 'velvet'] as const
export type Accent = (typeof ACCENTS)[number]

export interface ITicketType {
  _id: Types.ObjectId
  name: string
  description: string
  price: number
  quantity: number
  sold: number
  perOrderLimit: number
  salesStart: Date | null
  salesEnd: Date | null
  isActive: boolean
}

export interface IEvent extends Document {
  title: string
  slug: string
  tagline: string
  description: string
  brand: Brand
  accent: Accent
  heroImage: string
  posterImage: string
  trailerVideo: string
  trailerPoster: string
  gallery: string[]
  venue: { name: string; address: string; city: string; country: string }
  startsAt: Date
  endsAt: Date | null
  doorsOpenAt: Date | null
  status: 'draft' | 'published' | 'archived'
  isHeadline: boolean
  showPopup: boolean
  sortOrder: number
  lineup: { name: string; role: string; image: string }[]
  tags: string[]
  ticketTypes: Types.DocumentArray<ITicketType>
}

const ticketTypeSchema = new Schema<ITicketType>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 0 },
    sold: { type: Number, default: 0, min: 0 },
    perOrderLimit: { type: Number, default: 10, min: 1 },
    salesStart: { type: Date, default: null },
    salesEnd: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  { _id: true },
)

ticketTypeSchema.virtual('remaining').get(function (this: ITicketType) {
  return Math.max(0, this.quantity - this.sold)
})

ticketTypeSchema.virtual('isSoldOut').get(function (this: ITicketType) {
  return this.sold >= this.quantity
})

ticketTypeSchema.virtual('onSale').get(function (this: ITicketType) {
  if (!this.isActive) return false
  if (this.sold >= this.quantity) return false
  const now = Date.now()
  if (this.salesStart && now < this.salesStart.getTime()) return false
  if (this.salesEnd && now > this.salesEnd.getTime()) return false
  return true
})

const eventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    tagline: { type: String, default: '', trim: true },
    description: { type: String, default: '' },
    brand: { type: String, enum: BRANDS, default: 'Luxury Music Sounds' },
    accent: { type: String, enum: ACCENTS, default: 'gold' },

    heroImage: { type: String, default: '' },
    posterImage: { type: String, default: '' },
    /** Optional highlight reel shown on the event page, next to Buy Tickets. */
    trailerVideo: { type: String, default: '' },
    trailerPoster: { type: String, default: '' },
    gallery: { type: [String], default: [] },

    venue: {
      name: { type: String, default: '' },
      address: { type: String, default: '' },
      city: { type: String, default: '' },
      country: { type: String, default: 'Nigeria' },
    },

    startsAt: { type: Date, required: true, index: true },
    endsAt: { type: Date, default: null },
    doorsOpenAt: { type: Date, default: null },

    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    /** Headline (a.k.a. special) events surface on the home page and open the buy dialog. */
    isHeadline: { type: Boolean, default: false, index: true },
    showPopup: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },

    lineup: {
      type: [
        {
          _id: false,
          name: { type: String, default: '' },
          role: { type: String, default: '' },
          image: { type: String, default: '' },
        },
      ],
      default: [],
    },
    tags: { type: [String], default: [] },
    ticketTypes: { type: [ticketTypeSchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

eventSchema.index({ status: 1, startsAt: 1 })
eventSchema.index({ isHeadline: 1, status: 1 })

eventSchema.virtual('isPast').get(function (this: IEvent) {
  const reference = this.endsAt ?? this.startsAt
  return reference.getTime() < Date.now()
})

eventSchema.virtual('totalCapacity').get(function (this: IEvent) {
  return this.ticketTypes.reduce((sum, type) => sum + type.quantity, 0)
})

eventSchema.virtual('totalSold').get(function (this: IEvent) {
  return this.ticketTypes.reduce((sum, type) => sum + type.sold, 0)
})

eventSchema.virtual('isSoldOut').get(function (this: IEvent) {
  if (this.ticketTypes.length === 0) return false
  return this.ticketTypes.every((type) => type.sold >= type.quantity)
})

eventSchema.virtual('lowestPrice').get(function (this: IEvent) {
  const active = this.ticketTypes.filter((type) => type.isActive)
  if (active.length === 0) return null
  return Math.min(...active.map((type) => type.price))
})

/** True when the public site should show a working "buy tickets" affordance. */
eventSchema.virtual('ticketsOnSale').get(function (this: IEvent) {
  const now = Date.now()
  const reference = this.endsAt ?? this.startsAt
  if (this.status !== 'published' || reference.getTime() < now) return false
  return this.ticketTypes.some((type) => {
    if (!type.isActive || type.sold >= type.quantity) return false
    if (type.salesStart && now < type.salesStart.getTime()) return false
    if (type.salesEnd && now > type.salesEnd.getTime()) return false
    return true
  })
})

export const Event: Model<IEvent> =
  (mongoose.models.Event as Model<IEvent>) ?? mongoose.model<IEvent>('Event', eventSchema)
