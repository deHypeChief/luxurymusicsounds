import { AlertCircle, Check, Copy, Loader2, Ticket } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Script } from '../components/Typography'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { publicApi } from '../lib/api'
import { formatPrice } from '../lib/format'

/**
 * Where Paystack returns the buyer. The reference in the URL is only a hint -
 * the server re-verifies against Paystack before anything is shown as paid.
 */
export default function TicketConfirm() {
  useDocumentTitle('Your tickets')

  const [params] = useSearchParams()
  const reference = params.get('reference') ?? params.get('trxref')

  const [state, setState] = useState({ status: 'checking', data: null, error: null })
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!reference) {
      setState({ status: 'missing', data: null, error: null })
      return
    }

    let cancelled = false

    publicApi
      .verifyCheckout(reference)
      .then((data) => {
        if (cancelled) return
        setState({ status: data.status === 'paid' ? 'paid' : 'unpaid', data, error: null })
      })
      .catch((error) => {
        if (cancelled) return
        setState({ status: 'error', data: null, error })
      })

    return () => {
      cancelled = true
    }
  }, [reference])

  const copyCodes = async () => {
    const codes = (state.data?.tickets ?? []).map((ticket) => ticket.code).join('\n')
    try {
      await navigator.clipboard.writeText(codes)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="wash-royal flex min-h-[100svh] items-center justify-center px-6 py-32">
      <div className="w-full max-w-2xl">
        {state.status === 'checking' ? (
          <div className="surface p-12 text-center">
            <Loader2
              size={26}
              strokeWidth={1.5}
              className="mx-auto mb-5 animate-spin text-gold"
            />
            <h1 className="u-display text-3xl">Confirming your payment</h1>
            <p className="mt-3 text-sm text-ivory-dim">
              This takes a moment. Please do not close the page.
            </p>
          </div>
        ) : state.status === 'paid' ? (
          <div className="surface overflow-hidden">
            <div className="border-b border-ink-line bg-gold/8 p-10 text-center">
              <span className="mx-auto mb-5 grid size-14 place-items-center rounded-full border border-gold-deep text-gold-lift">
                <Check size={24} strokeWidth={1.5} />
              </span>
              <p className="u-eyebrow">Order {state.data.reference}</p>
              <h1 className="u-display mt-4 text-4xl">
                You&rsquo;re <Script xl>in</Script>
              </h1>
              <p className="mx-auto mt-5 max-w-md text-ivory-dim">
                {state.data.tickets.length} ticket
                {state.data.tickets.length === 1 ? '' : 's'} for{' '}
                <span className="text-ivory">{state.data.eventTitle}</span>, booked under{' '}
                {state.data.customer?.email}.
              </p>
              <p className="mx-auto mt-3 max-w-md text-sm text-gold-lift">
                Save your codes before you leave this page. They are your entry.
              </p>
            </div>

            <div className="p-8">
              <div className="mb-4 flex items-center justify-between gap-4">
                <p className="u-eyebrow">Your ticket codes</p>
                <button
                  type="button"
                  onClick={copyCodes}
                  className="flex items-center gap-1.5 text-xs text-ivory-dim transition-colors hover:text-gold-lift"
                >
                  {copied ? (
                    <>
                      <Check size={13} strokeWidth={1.5} />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy size={13} strokeWidth={1.5} />
                      Copy all
                    </>
                  )}
                </button>
              </div>

              <ul className="space-y-2">
                {state.data.tickets.map((ticket) => (
                  <li
                    key={ticket.code}
                    className="flex items-center justify-between gap-4 border border-ink-line bg-ink p-4"
                  >
                    <span className="flex items-center gap-3">
                      <Ticket size={15} strokeWidth={1.5} className="shrink-0 text-gold" />
                      <span className="font-display text-lg font-semibold tracking-wider">
                        {ticket.code}
                      </span>
                    </span>
                    <span className="u-meta text-[0.625rem]">{ticket.ticketType}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex items-baseline justify-between border-t border-ink-line pt-5">
                <span className="u-meta">Paid</span>
                <span className="font-display text-2xl text-gold-lift">
                  {formatPrice(state.data.total, state.data.currency)}
                </span>
              </div>

              <p className="mt-6 text-center text-xs text-ivory-faint">
                Bring your code to the door, screenshot or printed.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/events" className="btn btn-ghost flex-1">
                  Browse more events
                </Link>
                <Link to="/" className="btn btn-solid flex-1">
                  Back to the site
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="surface p-12 text-center">
            <AlertCircle
              size={26}
              strokeWidth={1.5}
              className="mx-auto mb-5 text-velvet-lift"
            />
            <h1 className="u-display text-3xl">
              {state.status === 'missing'
                ? 'No order to confirm'
                : state.status === 'unpaid'
                  ? 'That payment did not go through'
                  : 'We could not confirm that order'}
            </h1>
            <p className="mx-auto mt-4 max-w-md text-ivory-dim">
              {state.status === 'missing'
                ? 'This page confirms a ticket order. Start from an event to buy one.'
                : state.status === 'unpaid'
                  ? 'Nothing was charged and your seats have been released. You can try again from the event page.'
                  : (state.error?.message ??
                    'If you were charged, send us your reference and we will sort it out.')}
            </p>

            {reference ? (
              <p className="u-meta mt-6">Reference {reference}</p>
            ) : null}

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/events" className="btn btn-buy">
                Back to events
              </Link>
              <a href="mailto:bookings@luxurymusicsounds.com" className="btn btn-ghost">
                Contact us
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
