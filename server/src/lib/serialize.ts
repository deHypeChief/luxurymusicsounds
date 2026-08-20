import { imageUrl } from './cloudflare.ts'
import type { IEvent, ITicketType } from '../models/Event.ts'
import type { IGalleryItem } from '../models/GalleryItem.ts'
import type { ISettings } from '../models/Settings.ts'

function ticketTypeOnSale(type: ITicketType): boolean {
  if (!type.isActive) return false
  if (type.sold >= type.quantity) return false
  const now = Date.now()
  if (type.salesStart && now < new Date(type.salesStart).getTime()) return false
  if (type.salesEnd && now > new Date(type.salesEnd).getTime()) return false
  return true
}

function publicTicketType(type: ITicketType) {
  const remaining = Math.max(0, type.quantity - type.sold)
  return {
    id: String(type._id),
    name: type.name,
    description: type.description,
    price: type.price,
    perOrderLimit: Math.max(1, Math.min(type.perOrderLimit, remaining || 1)),
    remaining,
    // Exact stock is only worth showing once it reads as scarcity.
    lowStock: remaining > 0 && remaining <= 10,
    isSoldOut: remaining === 0,
    onSale: ticketTypeOnSale(type),
    salesStart: type.salesStart,
    salesEnd: type.salesEnd,
  }
}

export function publicEvent(event: IEvent) {
  const ticketTypes = event.ticketTypes.map(publicTicketType)
  const onSale = ticketTypes.filter((type) => type.onSale)
  const prices = ticketTypes.filter((type) => !type.isSoldOut).map((type) => type.price)
  const reference = event.endsAt ?? event.startsAt

  return {
    id: String(event._id),
    title: event.title,
    slug: event.slug,
    tagline: event.tagline,
    description: event.description,
    brand: event.brand,
    accent: event.accent,

    heroImage: imageUrl(event.heroImage),
    posterImage: imageUrl(event.posterImage || event.heroImage),
    trailerVideo: imageUrl(event.trailerVideo),
    // Falls back to the hero still, so a trailer always has something to show
    // before the first frame decodes.
    trailerPoster: imageUrl(event.trailerPoster || event.heroImage),
    gallery: event.gallery.map((item) => imageUrl(item)),

    venue: event.venue,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    doorsOpenAt: event.doorsOpenAt,

    isHeadline: event.isHeadline,
    showPopup: event.showPopup,
    // Fields are copied by name, not spread: these are Mongoose subdocuments,
    // and spreading one yields its internals (__parentArray and friends)
    // rather than the schema paths.
    lineup: event.lineup.map((artist) => ({
      name: artist.name,
      role: artist.role,
      image: imageUrl(artist.image),
    })),
    tags: event.tags,

    ticketTypes,
    ticketsOnSale: onSale.length > 0 && new Date(reference).getTime() > Date.now(),
    isSoldOut: ticketTypes.length > 0 && ticketTypes.every((type) => type.isSoldOut),
    isPast: new Date(reference).getTime() < Date.now(),
    lowestPrice: prices.length > 0 ? Math.min(...prices) : null,
  }
}

/** The admin view keeps raw sales figures the public serializer strips out. */
export function adminEvent(event: IEvent) {
  const totalCapacity = event.ticketTypes.reduce((sum, type) => sum + type.quantity, 0)
  const totalSold = event.ticketTypes.reduce((sum, type) => sum + type.sold, 0)

  return {
    ...publicEvent(event),
    status: event.status,
    sortOrder: event.sortOrder,
    // Raw ids so the admin form can round-trip edits without lossy re-uploads.
    heroImageId: event.heroImage,
    posterImageId: event.posterImage,
    trailerVideoId: event.trailerVideo,
    trailerPosterId: event.trailerPoster,
    galleryIds: event.gallery,
    totalCapacity,
    totalSold,
    grossRevenue: event.ticketTypes.reduce((sum, type) => sum + type.sold * type.price, 0),
    ticketTypes: event.ticketTypes.map((type) => ({
      id: String(type._id),
      name: type.name,
      description: type.description,
      price: type.price,
      quantity: type.quantity,
      sold: type.sold,
      remaining: Math.max(0, type.quantity - type.sold),
      perOrderLimit: type.perOrderLimit,
      salesStart: type.salesStart,
      salesEnd: type.salesEnd,
      isActive: type.isActive,
    })),
    createdAt: (event as unknown as { createdAt: Date }).createdAt,
    updatedAt: (event as unknown as { updatedAt: Date }).updatedAt,
  }
}

export function publicGalleryItem(item: IGalleryItem) {
  return {
    id: String(item._id),
    title: item.title,
    caption: item.caption,
    mediaType: item.mediaType,
    image: imageUrl(item.image),
    poster: imageUrl(item.poster),
    brand: item.brand,
    category: item.category,
    orientation: item.orientation,
    featured: item.featured,
    sortOrder: item.sortOrder,
    event: item.event ? String(item.event) : null,
  }
}

export function adminGalleryItem(item: IGalleryItem) {
  return {
    ...publicGalleryItem(item),
    imageId: item.image,
    posterId: item.poster,
    isPublished: item.isPublished,
  }
}

export function publicSettings(settings: ISettings) {
  return {
    contact: {
      email: settings.contact?.email ?? '',
      phone: settings.contact?.phone ?? '',
      city: settings.contact?.city ?? '',
    },
    footerHeading: settings.footerHeading,
    footerIntro: settings.footerIntro,
    socials: [...settings.socials]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((social) => ({
        id: String((social as unknown as { _id: unknown })._id),
        brand: social.brand,
        platform: social.platform,
        handle: social.handle,
        url: social.url,
        sortOrder: social.sortOrder,
      })),
  }
}
