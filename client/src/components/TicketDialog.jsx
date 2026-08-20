import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Loader2, Lock, Minus, Plus, Ticket } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { publicApi } from '../lib/api'
import { formatDate, formatMoney, formatPrice, formatTime } from '../lib/format'
import Dialog from './Dialog'
import { Script } from './Typography'

/**
 * The buy flow, in two steps: pick tiers, then hand over contact details.
 *
 * Splitting it keeps the first screen about the tickets rather than about
 * form-filling, and means we only ask for personal details once someone has
 * actually decided to buy something.
 */
export default function TicketDialog({ open, onClose, event }) {
  const navigate = useNavigate()

  const [step, setStep] = useState('select')
  const [quantities, setQuantities] = useState({})
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})

  // Reset whenever a different event opens, so quantities never leak across.
  useEffect(() => {
    if (!open) return
    setStep('select')
    setQuantities({})
    setError(null)
    setFieldErrors({})
    setIsSubmitting(false)
  }, [open, event?.id])

  const tiers = useMemo(() => event?.ticketTypes ?? [], [event])

  const lines = useMemo(
    () =>
      tiers
        .map((tier) => ({ tier, quantity: quantities[tier.id] ?? 0 }))
        .filter((line) => line.quantity > 0),
    [tiers, quantities],
  )

  const total = lines.reduce((sum, line) => sum + line.tier.price * line.quantity, 0)
  const ticketCount = lines.reduce((sum, line) => sum + line.quantity, 0)

  const setQuantity = (tier, next) => {
    const ceiling = Math.min(tier.perOrderLimit, tier.remaining)
    const clamped = Math.max(0, Math.min(next, ceiling))
    setQuantities((current) => ({ ...current, [tier.id]: clamped }))
    setError(null)
  }

  const handleSubmit = async (submitEvent) => {
    submitEvent.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setFieldErrors({})

    try {
      const result = await publicApi.startCheckout({
        eventSlug: event.slug,
        customer: {
          name: customer.name.trim(),
          email: customer.email.trim(),
          phone: customer.phone.trim(),
        },
        items: lines.map((line) => ({
          ticketTypeId: line.tier.id,
          quantity: line.quantity,
        })),
      })

      if (result.authorizationUrl) {
        // Hand off to Paystack. They return to /tickets/confirm afterwards.
        window.location.assign(result.authorizationUrl)
        return
      }

      // Free events issue tickets immediately, with no payment step.
      onClose()
      navigate(`/tickets/confirm?reference=${encodeURIComponent(result.reference)}`)
    } catch (caught) {
      setError(caught.message)
      setFieldErrors(caught.fieldErrors ?? {})
      setIsSubmitting(false)
    }
  }

  if (!event) return null

  const soldOut = event.isSoldOut || tiers.every((tier) => !tier.onSale)

  return (
    <Dialog open={open} onClose={onClose} label={`Tickets for ${event.title}`} size="lg">
      <div className="grid md:grid-cols-[0.85fr_1fr]">
        {/* Poster rail, keeps the event present while you fill the form. */}
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
          <AnimatePresence mode="wait">
            {step === 'select' ? (
              <motion.div
                key="select"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.25 }}
              >
                <p className="u-eyebrow mb-2">Step 1 of 2</p>
                <h2 className="u-display mb-1 text-3xl">
                  Choose your <Script>seats</Script>
                </h2>
                <p className="mb-6 text-sm text-ivory-dim md:hidden">
                  {event.title} · {formatDate(event.startsAt)}
                </p>

                {soldOut ? (
                  <div className="border border-velvet/50 bg-velvet-deep/25 p-6 text-center">
                    <p className="u-eyebrow mb-2 text-velvet-lift">Sold out</p>
                    <p className="text-sm text-ivory-dim">
                      Every tier has gone. Follow us for returns and the next date.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {tiers.map((tier) => {
                      const quantity = quantities[tier.id] ?? 0
                      const ceiling = Math.min(tier.perOrderLimit, tier.remaining)
                      const unavailable = !tier.onSale

                      return (
                        <li
                          key={tier.id}
                          className={`border p-4 transition-colors ${
                            quantity > 0
                              ? 'border-gold-deep bg-gold/5'
                              : 'border-ink-line bg-ink/40'
                          } ${unavailable ? 'opacity-50' : ''}`}
                        >
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

                              {tier.isSoldOut ? (
                                <p className="u-meta mt-2 text-velvet-lift">Sold out</p>
                              ) : tier.lowStock ? (
                                <p className="u-meta mt-2 text-velvet-lift">
                                  Only {tier.remaining} left
                                </p>
                              ) : unavailable ? (
                                <p className="u-meta mt-2">Not on sale</p>
                              ) : null}
                            </div>

                            <p className="shrink-0 font-display text-xl font-semibold text-gold-lift">
                              {formatPrice(tier.price)}
                            </p>
                          </div>

                          {!unavailable ? (
                            <div className="mt-4 flex items-center justify-between">
                              <span className="u-meta">
                                {ceiling} max per order
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setQuantity(tier, quantity - 1)}
                                  disabled={quantity === 0}
                                  className="grid size-9 place-items-center rounded-full border border-ink-line text-ivory-dim transition hover:border-gold-deep hover:text-gold-lift disabled:opacity-30 disabled:hover:border-ink-line"
                                  aria-label={`One fewer ${tier.name} ticket`}
                                >
                                  <Minus size={14} strokeWidth={1.5} />
                                </button>
                                <span
                                  className="w-10 text-center font-display text-lg font-semibold tabular-nums"
                                  aria-live="polite"
                                  aria-label={`${quantity} ${tier.name} tickets`}
                                >
                                  {quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setQuantity(tier, quantity + 1)}
                                  disabled={quantity >= ceiling}
                                  className="grid size-9 place-items-center rounded-full border border-ink-line text-ivory-dim transition hover:border-gold-deep hover:text-gold-lift disabled:opacity-30 disabled:hover:border-ink-line"
                                  aria-label={`One more ${tier.name} ticket`}
                                >
                                  <Plus size={14} strokeWidth={1.5} />
                                </button>
                              </div>
                            </div>
                          ) : null}
                        </li>
                      )
                    })}
                  </ul>
                )}

                {!soldOut ? (
                  <>
                    <div className="mt-6 flex items-baseline justify-between border-t border-ink-line pt-5">
                      <span className="u-meta">
                        {ticketCount === 0
                          ? 'No tickets selected'
                          : `${ticketCount} ticket${ticketCount === 1 ? '' : 's'}`}
                      </span>
                      <span className="font-display text-3xl font-semibold text-ivory tabular-nums">
                        {/* An empty basket is worth nothing, not "Free", that
                            word is reserved for an actual free ticket tier. */}
                        {ticketCount === 0 ? formatMoney(0) : formatPrice(total)}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="btn btn-buy mt-5 w-full"
                      disabled={ticketCount === 0}
                      onClick={() => setStep('details')}
                    >
                      Continue
                      <ArrowRight size={15} strokeWidth={1.5} />
                    </button>
                  </>
                ) : null}
              </motion.div>
            ) : (
              <motion.form
                key="details"
                onSubmit={handleSubmit}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.25 }}
              >
                <p className="u-eyebrow mb-2">Step 2 of 2</p>
                <h2 className="u-display mb-6 text-3xl">
                  Where do we send <Script>them?</Script>
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="field-label" htmlFor="ticket-name">
                      Full name
                    </label>
                    <input
                      id="ticket-name"
                      className="field"
                      value={customer.name}
                      onChange={(changeEvent) =>
                        setCustomer({ ...customer, name: changeEvent.target.value })
                      }
                      placeholder="Ada Okonkwo"
                      autoComplete="name"
                      required
                    />
                    {fieldErrors['customer.name'] ? (
                      <p className="mt-1.5 text-xs text-velvet-lift">
                        {fieldErrors['customer.name']}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label className="field-label" htmlFor="ticket-email">
                      Email
                    </label>
                    <input
                      id="ticket-email"
                      type="email"
                      className="field"
                      value={customer.email}
                      onChange={(changeEvent) =>
                        setCustomer({ ...customer, email: changeEvent.target.value })
                      }
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                    />
                    <p className="mt-1.5 text-xs text-ivory-faint">
                      Your payment receipt goes here, and it is how we reach you about the
                      event.
                    </p>
                    {fieldErrors['customer.email'] ? (
                      <p className="mt-1.5 text-xs text-velvet-lift">
                        {fieldErrors['customer.email']}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label className="field-label" htmlFor="ticket-phone">
                      Phone <span className="normal-case tracking-normal">(optional)</span>
                    </label>
                    <input
                      id="ticket-phone"
                      type="tel"
                      className="field"
                      value={customer.phone}
                      onChange={(changeEvent) =>
                        setCustomer({ ...customer, phone: changeEvent.target.value })
                      }
                      placeholder="+234 800 000 0000"
                      autoComplete="tel"
                    />
                  </div>
                </div>

                <div className="mt-6 border border-ink-line bg-ink/50 p-4">
                  <p className="u-eyebrow mb-3">Your order</p>
                  <ul className="space-y-1.5">
                    {lines.map((line) => (
                      <li
                        key={line.tier.id}
                        className="flex justify-between gap-4 text-sm text-ivory-dim"
                      >
                        <span className="truncate">
                          {line.quantity} × {line.tier.name}
                        </span>
                        <span className="shrink-0 tabular-nums">
                          {formatPrice(line.tier.price * line.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 flex items-baseline justify-between border-t border-ink-line pt-3">
                    <span className="u-meta">Total</span>
                    <span className="font-display text-2xl font-semibold text-gold-lift tabular-nums">
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>

                {error ? (
                  <p
                    role="alert"
                    className="mt-4 border border-velvet/50 bg-velvet-deep/25 px-4 py-3 text-sm text-ivory"
                  >
                    {error}
                  </p>
                ) : null}

                <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row">
                  <button
                    type="button"
                    className="btn btn-ghost sm:w-auto"
                    onClick={() => setStep('select')}
                    disabled={isSubmitting}
                  >
                    <ArrowLeft size={15} strokeWidth={1.5} />
                    Back
                  </button>
                  <button type="submit" className="btn btn-buy flex-1" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 size={15} strokeWidth={1.5} className="animate-spin" />
                        Opening Paystack
                      </>
                    ) : total > 0 ? (
                      <>
                        <Lock size={14} strokeWidth={1.5} />
                        Pay {formatPrice(total)}
                      </>
                    ) : (
                      <>
                        <Ticket size={15} strokeWidth={1.5} />
                        Claim tickets
                      </>
                    )}
                  </button>
                </div>

                <p className="mt-3 text-center text-xs text-ivory-faint">
                  Payment is handled by Paystack. We never see your card details.
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Dialog>
  )
}
