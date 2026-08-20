# Luxury Music Sounds

Website and ticketing platform for Luxury Music Sounds, the Lagos live-music house
behind **Easystrings** and **The Four Seasons**.

Public site with an interactive gallery and ticket sales, plus an admin panel for
running events, ticket tiers, orders and door check-in.

```
luxurymusicsounds/
├── client/     React 19 + Vite + Tailwind v4   (public site + admin panel)
└── server/     Bun + Express 5 + Mongoose 9    (API, ticketing, payments)
```

---

## Running it locally

You need **Bun**, and **MongoDB** either running locally or an Atlas connection
string.

First time only, install dependencies and create the API's `.env`:

```bash
bun run setup && cp server/.env.example server/.env && bun run seed
```

Then, from the repo root:

```bash
bun dev
```

That starts both servers together, with prefixed output so you can tell them
apart:

```
api │ [api] Luxury Music Sounds API on http://localhost:4000
web │   ➜  Local:   http://localhost:5173/
```

| | |
| --- | --- |
| Site | http://localhost:5173 |
| Admin | http://localhost:5173/admin |
| API | http://localhost:4000 |

Vite proxies `/api` to the API, so both run on one origin in development and the
admin session cookie behaves exactly as it will in production.

Seeding creates an owner account, `admin@luxurymusicsounds.com` /
`ChangeMe!2026`: plus six demo events and 22 gallery images.
**Change that password after the first sign-in.**

### Root scripts

| Command | What it does |
| --- | --- |
| `bun dev` | Both servers, prefixed output. Ctrl-C stops both |
| `bun run stop` | Frees ports 4000 and 5173 if something was left running |
| `bun run dev:api` / `bun run dev:web` | One side on its own |
| `bun run seed` / `bun run seed:fresh` | Add demo data / wipe and re-add it |
| `bun run build` | Production build of the front end |
| `bun run lint` | Lint the front end |
| `bun run check` | Lint and build, as a pre-commit sweep |
| `bun run setup` | Install dependencies in both packages |

Ctrl-C in the terminal running `bun dev` shuts both servers down. If a terminal
is closed abruptly instead, Windows leaves the children holding their ports -
`bun run stop` clears them.

---

## Design system

The palette is **night-dominant**: ink is the ground, ivory is punctuation. Five
strong colours only work together if each has one job, so:

| Token | Hex | Job |
| --- | --- | --- |
| `ink` | `#0A0A0C` | The ground |
| `ivory` | `#EFEAE0` | Type, and the single editorial "intermission" section |
| `gold` | `#9C7A2B` | Connective tissue, hairlines, eyebrows, script accents |
| `royal` | `#16225C` | Atmosphere, gradient washes behind imagery |
| `velvet` | `#7A1C2B` | **Commerce only**: buy buttons, headline badge, sold-out |

Velvet never appears as decoration. If something is velvet, it is about a ticket.
That restraint is what makes it read as urgent when it does appear.

**Type** is Bodoni Moda (bold display), Pinyon Script (ornate cursive) and Jost (UI).
The signature move is a display headline in Bodoni caps with **one** word dropped into
oversized gold script that overlaps the cap line, `<Script xl>` in
`src/components/Typography.jsx`. One per headline; it stops working the moment it
repeats.

All tokens live in `client/src/index.css`.

---

## Connecting Paystack

Ticket sales stay switched off until these are set. The dashboard shows a banner while
they are missing.

1. Paystack dashboard → **Settings → API Keys & Webhooks**.
2. Copy the secret and public keys into `server/.env`:

   ```
   PAYSTACK_SECRET_KEY=sk_test_xxxxx
   PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
   ```

3. Set the **webhook URL** on that same page to:

   ```
   https://<your-api-domain>/api/webhooks/paystack
   ```

4. Restart the API.

Use the `sk_test_` / `pk_test_` pair while building and swap to live keys at launch.

### How a purchase actually runs

1. The buyer picks tiers. `POST /api/checkout/initialize` **holds the seats** and
   creates a pending order, then returns a Paystack URL.
2. The buyer pays on Paystack and is returned to `/tickets/confirm`.
3. That page calls `GET /api/checkout/verify/:reference`, which asks Paystack directly
   rather than trusting the redirect, then issues the tickets.
4. Paystack's webhook arrives independently and does the same thing.

Steps 3 and 4 routinely race each other. Fulfilment is claimed with a single
conditional update, so whoever loses gets the already-issued tickets back instead of
minting a duplicate set.

Unpaid holds expire after 20 minutes and a sweeper puts those seats back on sale.

---

## Connecting Cloudflare Images

Needed for uploading photographs through the admin panel.

1. **Account ID**: Cloudflare dashboard sidebar.
2. **API token**: My Profile → API Tokens → Create Token → *Cloudflare Images (Edit)*.
3. **Account hash**: Images → Developer Resources; it is the id inside your delivery
   URL, `https://imagedelivery.net/<hash>/<image-id>/public`.

```
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_IMAGES_TOKEN=...
CLOUDFLARE_ACCOUNT_HASH=...
```

Uploads go **straight from the browser to Cloudflare** using a one-shot URL minted by
the API, so image bytes never pass through the server and the token stays server-side.

Every image field also accepts a plain URL. That is not just a convenience, it is what
keeps the admin usable before these credentials are in place, and it is how the current
Unsplash placeholders are stored.

---

## Running events

**Events → New event.** Fill in the details and save; ticket tiers appear as a tab once
the event exists.

- **Status**: `draft` hides it, `published` puts it on sale, `archived` hides it while
  keeping every ticket record.
- **Headline (special) event**: the crown button on the events list. Takes the featured
  slot on the home page, and its buy dialog opens for first-time visitors once per
  session. Promoting one event automatically demotes any other, so there is only ever
  one headline.
- **Ticket tiers**: edited through their own endpoints, never the main event form, so a
  stale form can't overwrite live sales figures. A tier with sales against it can be
  switched off but not deleted, and its allocation cannot drop below the number sold.
- **Orders & attendees**: per event, with CSV export.
- **Door check-in** (`/admin/door`), type or scan a code. Built for one hand on a phone
  in a dark foyer: the field keeps focus, and a second scan of the same code is refused
  rather than silently admitting twice. Mis-scans can be undone.

---

## Deploying

The client is a static build (`bun run build` → `client/dist`) and can go on Cloudflare
Pages, Netlify or Vercel. The API needs a Node/Bun host, Render, Railway or Fly.

Set on the API:

```
NODE_ENV=production
CLIENT_URL=https://luxurymusicsounds.com
CORS_ORIGINS=https://luxurymusicsounds.com,https://www.luxurymusicsounds.com
COOKIE_DOMAIN=.luxurymusicsounds.com
JWT_SECRET=<openssl rand -hex 48>
```

Set `VITE_API_URL=https://api.luxurymusicsounds.com/api` on the client if the API is on
a different origin. In production the auth cookie is `secure` + `SameSite=None`, so the
API must be served over HTTPS.

Since the client is a single-page app, point all unmatched routes at `index.html`.

---

## Photographs and video

Real media lives in `client/public/media/`, served straight from the site root.
A file at `client/public/media/four-seasons/audience.jpg` is reachable at
`/media/four-seasons/audience.jpg`, and that path is exactly what you paste into
any image or video field in the admin panel. See
[`client/public/media/README.md`](client/public/media/README.md) for the folder
layout, naming, and the ffmpeg settings for encoding video.

Video appears in four places:

The gallery page is a draggable plane rather than a scrolling grid: tiles are
laid out in a repeating 4x4 pattern that packs with no holes, the plane wraps in
both directions so panning never reaches an edge, and clicking any tile opens
the full-screen preview. Phones get a plain two-column stack instead, because
one-handed panning around an infinite canvas is not a pleasure.

| Where | Behaviour | Set it in |
| --- | --- | --- |
| Home hero | Muted loop behind the headline | `BRAND_MEDIA.heroVideo` in `client/src/lib/site.js` |
| Gallery | Video tiles alongside photographs, full playback in the lightbox | Admin → Gallery (paste an `.mp4` path; it detects the type) |
| Event pages | Highlight reel beside Buy tickets | Admin → Events → Trailer |
| About | Full showreel with sound | `BRAND_MEDIA.showreel` in `client/src/lib/site.js` |

The hero loop is deliberately conservative: it is skipped entirely on reduced
motion, on metered or 2G connections, and on screens under 768px, and it pauses
when scrolled out of view. The poster still is the real content, and the video
is an enhancement laid over it, if it never loads, nothing is missing.

Nothing autoplays with sound. Gallery clips, trailers and the showreel all wait
behind their poster until someone presses play.

## Known gaps

Worth deciding on before launch:

- **Three photographs need re-supplying.** The `Luxury music sound` folder had
  three images (`IMG_1653` the roster shot, and `IMG_1687` / `IMG_1688`, the two
  wide candlelit hall frames). They were deleted in error during media
  processing and no copy survives on this machine. Copy them back into
  `client/public/media/luxury-music-sounds/` as `the-house.jpg`, `hall-wide.jpg`
  and `hall-audience.jpg`, then point the `LMS` block in `server/src/seed.ts`
  back at them and run `bun run seed:fresh`. Until then those slots borrow Four
  Seasons images and stills pulled from the LMS clips.
- **Two hall photographs carry a photographer credit.** `IMG_1687` and
  `IMG_1688` are watermarked "Yemi Sambo Studios". Confirm the licence, or get
  unwatermarked versions, before either goes on the live site.
- **No ticket emails.** Buyers see their codes on the confirmation page and are
  told to save them; Paystack sends its own payment receipt. Sending the codes
  by email needs an email provider (Resend, Postmark, SES).
- **Social links now live in the database.** Edit them at Admin > Settings. The
  handles were inferred from the display names in the brief, so confirm each one
  resolves before launch; both Facebook entries run a Facebook search rather
  than a vanity URL.
- **Founder copy is a placeholder.** `FOUNDER` in `client/src/lib/site.js` is
  written to the right shape and length so the layout is real, but the facts
  need replacing with Israel's own words.
- **No QR codes on tickets.** Codes are typed or scanned as text.

## A note on Bun and Mongoose

`bson` 6.8+ calls `v8.startupSnapshot.isBuildingSnapshot()` when it loads. Bun has not
implemented that API and throws instead of returning `false`, which takes Mongoose down
with it ([oven-sh/bun#32501](https://github.com/oven-sh/bun/issues/32501)).

`server/src/bun-compat.ts` answers the question honestly, we are never building a V8
snapshot, and is preloaded via `bunfig.toml`. It only patches when the real
implementation is missing, so it quietly stops doing anything once Bun ships it. Node is
unaffected.
