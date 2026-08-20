# Luxury Music Sounds

Static website. No server, no database, no API keys. Tickets are sold on
Paystack, not by this site.

## Run it

```bash
bun run setup
```

```bash
bun dev
```

http://localhost:5173

## Before it can go live

Four things. Nothing else is blocking.

**1. Create the Paystack pages.** For each event: Paystack dashboard →
Payment Pages → New Page. Add one product per ticket tier with a stock count.
Set the page's redirect URL to `https://<your-domain>/thank-you`.

**2. Paste the links in.** Each event in `client/src/content/events.js` has a
`ticketsUrl`. They are all placeholders right now and none of them exist.

**3. Re-supply three photographs.** `IMG_1653`, `IMG_1687`, `IMG_1688` from the
`Luxury music sound` folder. They were deleted in error and no copy survives.
Drop them into `client/public/media/luxury-music-sounds/`. Also check the
licence on `IMG_1687` and `IMG_1688`, both are watermarked "Yemi Sambo Studios".

**4. Replace the placeholder text.** The founder story in
`client/src/content/site.js` is written to the right length but the facts are
invented. Confirm the social links there too; they were guessed from the names
in the brief.

## Prices are in two places

The price in `events.js` is only a label on the poster. **Paystack is what
charges.** Change a price in one place and the site will advertise a number it
does not honour, so change it in both.

## Where to edit things

| | |
| --- | --- |
| Events | `client/src/content/events.js` |
| Gallery | `client/src/content/gallery.js` |
| Contact, socials, founder, footer | `client/src/content/site.js` |
| Photographs and video | `client/public/media/` |

A file at `client/public/media/four-seasons/audience.jpg` is referenced as
`/media/four-seasons/audience.jpg`. Encoding settings for video are in
[`client/public/media/README.md`](client/public/media/README.md).

Set `status: 'draft'` on an event to hide it while you prepare it.

## At the door

Paystack emails each buyer a receipt and that receipt is the ticket. Export the
event's transactions from Paystack and check names against the list. There is no
scanning.

## Deploy

```bash
bun run build
```

Publish `client/dist` to Cloudflare Pages, Netlify or Vercel. Point all
unmatched routes at `index.html`.

---

Design and layout notes are in [DESIGN.md](DESIGN.md).
