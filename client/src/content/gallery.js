/**
 * The gallery.
 *
 * Drop a file into client/public/media/<act>/ and add a line here. Nothing else
 * is needed: the path is the file's location with `client/public` removed.
 *
 * `orientation` decides the footprint on the gallery plane, so it should match
 * the real shape of the file ('portrait', 'landscape' or 'square').
 *
 * For a video, set `mediaType: 'video'`, point `src` at the .mp4 and `poster`
 * at a still. Without a poster a video tile is a black rectangle until it
 * loads. See client/public/media/README.md for the encoding settings.
 */

export const GALLERY = [
  // The Four Seasons
  { src: '/media/four-seasons/ensemble-on-stage.jpg', title: 'The full section', caption: 'Strings, piano and voice, mid-programme', brand: 'The Four Seasons', category: 'Performances', orientation: 'landscape', featured: true },
  { src: '/media/four-seasons/audience-full-house.jpg', title: 'A full house', caption: 'The room, three movements in', brand: 'The Four Seasons', category: 'Performances', orientation: 'landscape', featured: true },
  { src: '/media/four-seasons/quintet-candlelight.jpg', title: 'By candlelight', caption: 'The quintet, flowers along the stage front', brand: 'The Four Seasons', category: 'Performances', orientation: 'landscape' },
  { src: '/media/four-seasons/lead-violin.jpg', title: 'Lead violin', caption: 'From behind the section', brand: 'The Four Seasons', category: 'Performances', orientation: 'portrait', featured: true },
  { src: '/media/four-seasons/strings-in-close.jpg', title: 'In close', caption: 'The bow, an inch off the string', brand: 'The Four Seasons', category: 'Details', orientation: 'portrait' },

  // Easystrings
  { src: '/media/easystrings/portrait.jpg', title: 'Israel Peter', caption: 'Founder and lead violin', brand: 'Easystrings', category: 'Portraits', orientation: 'portrait', featured: true },
  { src: '/media/easystrings/standing-wide.jpg', title: 'Standing', caption: 'A room built entirely from candles', brand: 'Easystrings', category: 'Performances', orientation: 'portrait', featured: true },
  { src: '/media/easystrings/mid-phrase.jpg', title: 'Mid phrase', caption: 'The part of the set he enjoys most', brand: 'Easystrings', category: 'Performances', orientation: 'portrait' },
  { src: '/media/easystrings/seated-playing.jpg', title: 'Seated', caption: 'Second set, closer in', brand: 'Easystrings', category: 'Performances', orientation: 'portrait' },
  { src: '/media/easystrings/profile-in-candlelight.jpg', title: 'In profile', caption: 'Candlelight does the lighting design', brand: 'Easystrings', category: 'Performances', orientation: 'portrait' },
  { src: '/media/easystrings/bow-raised.jpg', title: 'Bow raised', caption: 'The half second before the first note', brand: 'Easystrings', category: 'Details', orientation: 'portrait' },
  { src: '/media/easystrings/candle-rows.jpg', title: 'Candle rows', caption: 'Every one of them lit by hand', brand: 'Easystrings', category: 'Venues', orientation: 'portrait' },
  { src: '/media/easystrings/full-flight.jpg', title: 'Full flight', caption: 'Nothing amplified worth mentioning', brand: 'Easystrings', category: 'Performances', orientation: 'portrait' },
  { src: '/media/easystrings/violin-at-rest.jpg', title: 'At rest', caption: 'Between sets', brand: 'Easystrings', category: 'Portraits', orientation: 'portrait' },

  // Clips
  { src: '/media/easystrings/candlelight-set.mp4', poster: '/media/easystrings/candlelight-set.jpg', mediaType: 'video', title: 'The candlelight set', caption: 'Easystrings, live', brand: 'Easystrings', category: 'Performances', orientation: 'portrait', featured: true },
  { src: '/media/luxury-music-sounds/candlelight-hall.mp4', poster: '/media/luxury-music-sounds/candlelight-hall.jpg', mediaType: 'video', title: 'Inside the hall', caption: 'The room as it fills', brand: 'Luxury Music Sounds', category: 'Venues', orientation: 'portrait' },
  { src: '/media/luxury-music-sounds/ensemble-live.mp4', poster: '/media/luxury-music-sounds/ensemble-live.jpg', mediaType: 'video', title: 'The ensemble, live', caption: 'Strings at full size', brand: 'Luxury Music Sounds', category: 'Performances', orientation: 'portrait', featured: true },
  { src: '/media/luxury-music-sounds/full-house.mp4', poster: '/media/luxury-music-sounds/full-house.jpg', mediaType: 'video', title: 'A full house', caption: 'From the back of the room', brand: 'Luxury Music Sounds', category: 'Performances', orientation: 'portrait' },
]

/** Shaped for the gallery components, which read `image` rather than `src`. */
export const galleryItems = GALLERY.map((item, index) => ({
  id: `gallery-${index}`,
  ...item,
  image: item.src,
  poster: item.poster ?? '',
  mediaType: item.mediaType ?? 'image',
  featured: item.featured ?? false,
}))

export const galleryCategories = [...new Set(galleryItems.map((item) => item.category))]

export const featuredGallery = galleryItems.filter((item) => item.featured)
