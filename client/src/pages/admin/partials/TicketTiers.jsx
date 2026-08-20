import { Check, Loader2, Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { adminApi } from '../../../lib/api'
import { formatMoney, formatPrice, toDateTimeLocal } from '../../../lib/format'

const BLANK_TIER = {
  name: '',
  description: '',
  price: 0,
  quantity: 100,
  perOrderLimit: 10,
  salesStart: '',
  salesEnd: '',
  isActive: true,
}

/**
 * Manages the ticket tiers on one event.
 *
 * Tiers are saved through their own endpoints rather than with the main event
 * form, so a stale form can never overwrite live `sold` counts.
 */
export default function TicketTiers({ event, onChanged }) {
  const [editingId, setEditingId] = useState(null)
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const tiers = event?.ticketTypes ?? []

  const remove = async (tier) => {
    if (!window.confirm(`Remove the "${tier.name}" tier?`)) return

    setBusyId(tier.id)
    setError(null)
    try {
      const updated = await adminApi.deleteTicketType(event.id, tier.id)
      onChanged(updated)
    } catch (caught) {
      setError(caught.message)
    } finally {
      setBusyId(null)
    }
  }

  const toggleActive = async (tier) => {
    setBusyId(tier.id)
    setError(null)
    try {
      const updated = await adminApi.updateTicketType(event.id, tier.id, {
        isActive: !tier.isActive,
      })
      onChanged(updated)
    } catch (caught) {
      setError(caught.message)
    } finally {
      setBusyId(null)
    }
  }

  const totalCapacity = tiers.reduce((sum, tier) => sum + tier.quantity, 0)
  const totalSold = tiers.reduce((sum, tier) => sum + tier.sold, 0)

  return (
    <div className="space-y-6">
      <div className="surface flex flex-wrap items-center justify-between gap-6 p-6">
        <div className="flex gap-10">
          <div>
            <p className="u-eyebrow">Capacity</p>
            <p className="mt-1.5 font-display text-3xl tabular-nums">{totalCapacity}</p>
          </div>
          <div>
            <p className="u-eyebrow">Sold</p>
            <p className="mt-1.5 font-display text-3xl tabular-nums text-gold-lift">
              {totalSold}
            </p>
          </div>
          <div>
            <p className="u-eyebrow">Remaining</p>
            <p className="mt-1.5 font-display text-3xl tabular-nums">
              {totalCapacity - totalSold}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsAdding(true)
            setEditingId(null)
          }}
          className="btn btn-buy btn-sm"
        >
          <Plus size={14} strokeWidth={1.5} />
          Add a tier
        </button>
      </div>

      {error ? (
        <p role="alert" className="border border-velvet/50 bg-velvet-deep/25 p-4 text-sm">
          {error}
        </p>
      ) : null}

      {isAdding ? (
        <TierForm
          eventId={event.id}
          onCancel={() => setIsAdding(false)}
          onSaved={(updated) => {
            onChanged(updated)
            setIsAdding(false)
          }}
        />
      ) : null}

      {tiers.length === 0 && !isAdding ? (
        <div className="surface p-12 text-center">
          <p className="font-display text-2xl">No ticket tiers yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ivory-dim">
            An event needs at least one tier before anyone can buy. Add Balcony, Floor, or
            whatever this room calls its sections.
          </p>
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="btn btn-buy btn-sm mt-6"
          >
            <Plus size={14} strokeWidth={1.5} />
            Add the first tier
          </button>
        </div>
      ) : null}

      <div className="space-y-3">
        {tiers.map((tier) =>
          editingId === tier.id ? (
            <TierForm
              key={tier.id}
              eventId={event.id}
              tier={tier}
              onCancel={() => setEditingId(null)}
              onSaved={(updated) => {
                onChanged(updated)
                setEditingId(null)
              }}
            />
          ) : (
            <article
              key={tier.id}
              className={`surface flex flex-wrap items-center gap-6 p-5 ${
                tier.isActive ? '' : 'opacity-60'
              }`}
            >
              <div className="min-w-48 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-xl font-semibold">{tier.name}</h3>
                  {!tier.isActive ? (
                    <span className="border border-ink-line px-2 py-0.5 text-[0.5625rem] uppercase tracking-[0.16em] text-ivory-faint">
                      Off
                    </span>
                  ) : null}
                </div>
                {tier.description ? (
                  <p className="mt-1 text-sm text-ivory-faint">{tier.description}</p>
                ) : null}
              </div>

              <div className="text-right">
                <p className="u-eyebrow text-[0.5625rem]">Price</p>
                <p className="mt-1 font-display text-xl tabular-nums text-gold-lift">
                  {formatPrice(tier.price)}
                </p>
              </div>

              <div className="text-right">
                <p className="u-eyebrow text-[0.5625rem]">Sold</p>
                <p className="mt-1 font-display text-xl tabular-nums">
                  {tier.sold}
                  <span className="text-sm text-ivory-faint">/{tier.quantity}</span>
                </p>
              </div>

              <div className="text-right">
                <p className="u-eyebrow text-[0.5625rem]">Revenue</p>
                <p className="mt-1 font-display text-xl tabular-nums">
                  {formatMoney(tier.sold * tier.price)}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => toggleActive(tier)}
                  disabled={busyId === tier.id}
                  className="border border-ink-line px-3 py-2 text-[0.625rem] uppercase tracking-[0.16em] text-ivory-dim transition-colors hover:border-gold-deep hover:text-gold-lift disabled:opacity-40"
                >
                  {tier.isActive ? 'Switch off' : 'Switch on'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingId(tier.id)
                    setIsAdding(false)
                  }}
                  className="border border-ink-line px-3 py-2 text-[0.625rem] uppercase tracking-[0.16em] text-ivory-dim transition-colors hover:border-gold-deep hover:text-gold-lift"
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => remove(tier)}
                  disabled={busyId === tier.id || tier.sold > 0}
                  title={
                    tier.sold > 0
                      ? 'Tickets have been sold at this tier. Switch it off instead'
                      : 'Delete this tier'
                  }
                  className="grid size-9 place-items-center border border-ink-line text-ivory-dim transition-colors hover:border-velvet hover:text-velvet-lift disabled:opacity-30 disabled:hover:border-ink-line"
                  aria-label={`Delete ${tier.name}`}
                >
                  <Trash2 size={14} strokeWidth={1.5} />
                </button>
              </div>
            </article>
          ),
        )}
      </div>
    </div>
  )
}

function TierForm({ eventId, tier, onCancel, onSaved }) {
  const [form, setForm] = useState(() =>
    tier
      ? {
          name: tier.name,
          description: tier.description,
          price: tier.price,
          quantity: tier.quantity,
          perOrderLimit: tier.perOrderLimit,
          salesStart: toDateTimeLocal(tier.salesStart),
          salesEnd: toDateTimeLocal(tier.salesEnd),
          isActive: tier.isActive,
        }
      : BLANK_TIER,
  )
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)

  const update = (patch) => setForm((current) => ({ ...current, ...patch }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    setError(null)

    const payload = {
      ...form,
      price: Number(form.price) || 0,
      quantity: Number(form.quantity) || 0,
      perOrderLimit: Number(form.perOrderLimit) || 1,
      salesStart: form.salesStart || null,
      salesEnd: form.salesEnd || null,
    }

    try {
      const updated = tier
        ? await adminApi.updateTicketType(eventId, tier.id, payload)
        : await adminApi.addTicketType(eventId, payload)
      onSaved(updated)
    } catch (caught) {
      setError(caught.message)
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="surface border-gold-deep p-6">
      <h3 className="mb-5 font-display text-xl font-semibold">
        {tier ? `Edit ${tier.name}` : 'New ticket tier'}
      </h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="tier-name">
            Name
          </label>
          <input
            id="tier-name"
            className="field"
            value={form.name}
            onChange={(event) => update({ name: event.target.value })}
            placeholder="Gold Circle"
            required
            autoFocus
          />
        </div>

        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="tier-description">
            What this tier includes
          </label>
          <input
            id="tier-description"
            className="field"
            value={form.description}
            onChange={(event) => update({ description: event.target.value })}
            placeholder="Front two rows, champagne on arrival"
          />
        </div>

        <div>
          <label className="field-label" htmlFor="tier-price">
            Price (₦)
          </label>
          <input
            id="tier-price"
            type="number"
            min="0"
            step="500"
            className="field"
            value={form.price}
            onChange={(event) => update({ price: event.target.value })}
            required
          />
          <p className="mt-1.5 text-xs text-ivory-faint">Set 0 for a free tier.</p>
        </div>

        <div>
          <label className="field-label" htmlFor="tier-quantity">
            Allocation
          </label>
          <input
            id="tier-quantity"
            type="number"
            min={tier?.sold ?? 0}
            className="field"
            value={form.quantity}
            onChange={(event) => update({ quantity: event.target.value })}
            required
          />
          {tier?.sold > 0 ? (
            <p className="mt-1.5 text-xs text-ivory-faint">
              Cannot go below {tier.sold}, that many are already sold.
            </p>
          ) : null}
        </div>

        <div>
          <label className="field-label" htmlFor="tier-limit">
            Max per order
          </label>
          <input
            id="tier-limit"
            type="number"
            min="1"
            max="50"
            className="field"
            value={form.perOrderLimit}
            onChange={(event) => update({ perOrderLimit: event.target.value })}
            required
          />
        </div>

        <div className="flex items-end">
          <label className="flex cursor-pointer items-center gap-3 pb-3">
            <input
              type="checkbox"
              className="accent-[#9C7A2B]"
              checked={form.isActive}
              onChange={(event) => update({ isActive: event.target.checked })}
            />
            <span className="text-sm text-ivory">On sale</span>
          </label>
        </div>

        <div>
          <label className="field-label" htmlFor="tier-sales-start">
            Sales open (optional)
          </label>
          <input
            id="tier-sales-start"
            type="datetime-local"
            className="field"
            value={form.salesStart}
            onChange={(event) => update({ salesStart: event.target.value })}
          />
        </div>

        <div>
          <label className="field-label" htmlFor="tier-sales-end">
            Sales close (optional)
          </label>
          <input
            id="tier-sales-end"
            type="datetime-local"
            className="field"
            value={form.salesEnd}
            onChange={(event) => update({ salesEnd: event.target.value })}
          />
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-4 border border-velvet/50 bg-velvet-deep/25 p-3 text-sm">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex gap-3">
        <button type="submit" className="btn btn-buy btn-sm" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 size={13} strokeWidth={1.5} className="animate-spin" />
              Saving
            </>
          ) : (
            <>
              <Check size={13} strokeWidth={1.5} />
              {tier ? 'Save tier' : 'Add tier'}
            </>
          )}
        </button>
        <button type="button" onClick={onCancel} className="btn btn-ghost btn-sm">
          <X size={13} strokeWidth={1.5} />
          Cancel
        </button>
      </div>
    </form>
  )
}
