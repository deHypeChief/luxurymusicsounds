import { ArrowUpRight, Lock, Ticket } from 'lucide-react'
import { formatDate, formatPrice, formatTime } from '../lib/format'
import Dialog from './Dialog'
import { Script } from './Typography'

/**
 * The buy step.
 *
 * Tickets are sold by Paystack, not by this site. This dialog shows what is on
 * offer and hands the buyer over to the event's Paystack Payment Page, which
 * owns the prices, the remaining stock and the payment itself.
 *
 * Sending people out rather than taking card details here is the whole reason
 * this site needs no server: a page whose amount is set by our JavaScript could
 * be edited in the browser to pay any figure the buyer liked, and with nothing
 * running server-side there would be no way to catch it. Paystack's own page
 * cannot be tampered with.
 */
export default function TicketDialog({ open, onClose, event }) {
  if (!event) return null

  const canBuy = event.ticketsOnSale && Boolean(event.ticketsUrl)

  return (
    <Dialog open={open} onClose={onClose} label={`Tickets for ${event.title}`} size="lg">
      <div className="grid md:grid-cols-[0.85fr_1fr]">
        <div className="relative hidden min-h-full overflow-hidden md:block">
          <img
            src={event.posterImage || event.heroImage}
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
          <div className="scrim absolute inset-0" />
          <div className="relative flex h-full flex-col justify-end gap-3 p-8">
            <p className="u-eyebrow">{event.brand}</p>
            <h3 className="u-display text-3xl leading-[0.95]">{event.title}</h3>
            <p className="u-meta">
              {formatDate(event.startsAt)} · {formatTime(event.startsAt)}
            </p>
            {event.venue?.name ? (
              <p className="text-sm text-ivory-dim">
                {event.venue.name}
                {event.venue.city ? `, ${event.venue.city}` : ''}
              </p>
            ) : null}
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <p className="u-eyebrow mb-2">Tickets</p>
          <h2 className="u-display mb-1 text-3xl">
            Choose your <Script>seats</Script>
          </h2>
          <p className="mb-6 text-sm text-ivory-dim md:hidden">
            {event.title} · {formatDate(event.startsAt)}
          </p>

          {canBuy ? (
            <>
              <ul className="space-y-3">
                {event.ticketTypes.map((tier) => (
                  <li key={tier.id} className="border border-ink-line bg-ink/40 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="font-sans text-base font-medium tracking-wide text-ivory">
                          {tier.name}
                        </h3>
                        {tier.description ? (
                          <p className="mt-1 text-sm leading-snug text-ivory-faint">
                            {tier.description}
                          </p>
                        ) : null}
                      </div>
                      <p className="shrink-0 font-display text-xl font-semibold text-gold-lift">
                        {formatPrice(tier.price)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              <a
                href={event.ticketsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-buy mt-6 w-full"
              >
                <Ticket size={15} strokeWidth={1.5} />
                Choose seats and pay
                <ArrowUpRight size={15} strokeWidth={1.5} />
              </a>

              <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-ivory-faint">
                <Lock size={12} strokeWidth={1.5} />
                Secure checkout on Paystack. Your receipt is your ticket.
              </p>

              <p className="mt-3 text-center text-xs text-ivory-faint">
                Quantities and availability are confirmed on the next page.
              </p>
            </>
          ) : (
            <div className="border border-velvet/50 bg-velvet-deep/25 p-6 text-center">
              <p className="u-eyebrow mb-2 text-velvet-lift">
                {event.isPast ? 'This evening has passed' : 'Not yet on sale'}
              </p>
              <p className="text-sm text-ivory-dim">
                {event.isPast
                  ? 'Photographs from the night are in the gallery.'
                  : 'Tickets for this date open shortly. Follow us and you will hear first.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  )
}
