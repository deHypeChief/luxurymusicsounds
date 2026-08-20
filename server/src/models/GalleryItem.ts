import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose'
import { BRANDS } from './Event.ts'

export interface IGalleryItem extends Document {
  title: string
  caption: string
  mediaType: 'image' | 'video'
  image: string
  poster: string
  brand: string
  category: string
  orientation: 'portrait' | 'landscape' | 'square'
  featured: boolean
  sortOrder: number
  event: Types.ObjectId | null
  isPublished: boolean
}

const galleryItemSchema = new Schema<IGalleryItem>(
  {
    title: { type: String, default: '', trim: true },
    caption: { type: String, default: '', trim: true },
    mediaType: { type: String, enum: ['image', 'video'], default: 'image', index: true },
    /** Cloudflare image id, or a site-relative path for shipped media. */
    image: { type: String, required: true },
    /**
     * Still frame for a video tile. A video with no poster is a black square
     * in a mosaic until it loads, so this is what the grid actually renders.
     */
    poster: { type: String, default: '' },
    brand: { type: String, enum: BRANDS, default: 'Luxury Music Sounds', index: true },
    category: { type: String, default: 'Performances', trim: true, index: true },
    /** Drives the masonry tile span on the gallery grid. */
    orientation: {
      type: String,
      enum: ['portrait', 'landscape', 'square'],
      default: 'landscape',
    },
    featured: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    event: { type: Schema.Types.ObjectId, ref: 'Event', default: null },
    isPublished: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, toJSON: { virtuals: true } },
)

galleryItemSchema.index({ isPublished: 1, sortOrder: 1 })

export const GalleryItem: Model<IGalleryItem> =
  (mongoose.models.GalleryItem as Model<IGalleryItem>) ??
  mongoose.model<IGalleryItem>('GalleryItem', galleryItemSchema)
