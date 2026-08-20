# Design notes

Reference for whoever works on the look. Nothing here is needed to run or
deploy the site: see the [README](README.md) for that.

## Design system

The palette is **night-dominant**: ink is the ground, ivory is punctuation. Five
strong colours only work together if each has one job, so:

| Token | Hex | Job |
| --- | --- | --- |
| `ink` | `#0A0A0C` | The ground |
| `ivory` | `#EFEAE0` | Type, and the single editorial "intermission" section |
| `gold` | `#9C7A2B` | Connective tissue: hairlines, eyebrows, script accents |
| `royal` | `#16225C` | Atmosphere: gradient washes behind imagery |
| `velvet` | `#7A1C2B` | **Commerce only**: buy buttons, headline badge |

Velvet never appears as decoration. If something is velvet, it is about a ticket.

**Type** is Bodoni Moda (display), Pinyon Script (cursive) and Jost (UI). The
signature move is a display headline in Bodoni caps with **one** word dropped
into oversized gold script that overlaps the cap line: `<Script xl>` in
`src/components/Typography.jsx`. One per headline.

All tokens are in `client/src/index.css`.

### The gallery

The gallery page is a draggable plane rather than a scrolling grid. Tiles are
laid out in a repeating 4x4 pattern that packs with no holes, the plane wraps in
both directions so panning never reaches an edge, and clicking any tile opens a
full-screen preview. It snaps into frame as you scroll to it, and the wheel only
pans once it is fully framed so you can still scroll past. Phones get a plain
two-column stack instead.

### Video

Clips appear in the gallery and on event pages, and one runs as the About
showreel. Nothing autoplays with sound: a clip waits behind its poster until
someone opens it. Set the About showreel in `BRAND_MEDIA` in `content/site.js`.

---
