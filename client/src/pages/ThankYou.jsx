import { Check, Mail, Ticket } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Script } from '../components/Typography'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { CONTACT } from '../content/site'

/**
 * Where Paystack returns a buyer after payment.
 *
 * This page cannot confirm anything by itself: the payment happened on
 * Paystack, and with no server there is nothing here that can ask Paystack
 * whether it succeeded. So it says what is true regardless, and points at the
 * receipt, which is the actual proof of purchase.
 */
export default function ThankYou() {
  useDocumentTitle('Thank you')

  return (
    <div className="wash-royal flex min-h-[100svh] items-center justify-center px-6 py-24">
      <div className="w-full max-w-xl text-center">
        <span className="mx-auto mb-7 grid size-14 place-items-center rounded-full border border-gold-deep text-gold-lift">
          <Check size={24} strokeWidth={1.5} />
        </span>

        <p className="u-eyebrow">Order complete</p>

        <h1 className="u-display mt-5 text-[length:var(--text-display)]">
          We will see you <Script xl>there</Script>
        </h1>

        <p className="mx-auto mt-8 max-w-md text-lg text-ivory-dim">
          Paystack has emailed your receipt. That receipt is your ticket, so keep it
          somewhere you can find it on the night.
        </p>

        <div className="mx-auto mt-10 max-w-sm border border-ink-line bg-ink-raised p-6 text-left">
          <p className="u-eyebrow mb-4">At the door</p>
          <ul className="space-y-3 text-sm text-ivory-dim">
            <li className="flex items-start gap-3">
              <Ticket size={15} strokeWidth={1.5} className="mt-0.5 shrink-0 text-gold" />
              Give the name the tickets were bought under.
            </li>
            <li className="flex items-start gap-3">
              <Mail size={15} strokeWidth={1.5} className="mt-0.5 shrink-0 text-gold" />
              Have the Paystack receipt to hand, printed or on your phone.
            </li>
          </ul>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link to="/events" className="btn btn-solid">
            See the rest of the season
          </Link>
          <a href={`mailto:${CONTACT.email}`} className="btn btn-ghost">
            Something wrong? Email us
          </a>
        </div>
      </div>
    </div>
  )
}
