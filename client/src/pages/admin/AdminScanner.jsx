import { AlertCircle, Check, Loader2, ScanLine, Undo2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { AdminHeader } from '../../components/admin/AdminLayout'
import { adminApi } from '../../lib/api'
import { formatTime } from '../../lib/format'

/**
 * Door check-in.
 *
 * Built for one hand on a phone at a doorway: the field keeps focus, submitting
 * clears it ready for the next guest, and the result is a single colour you can
 * read at arm's length in a dark foyer. A running log sits underneath so the
 * person on the door can see what they just did.
 */
export default function AdminScanner() {
  const [code, setCode] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [result, setResult] = useState(null)
  const [log, setLog] = useState([])

  const inputRef = useRef(null)

  // Keep focus in the field: a hardware scanner types into whatever is focused.
  useEffect(() => {
    inputRef.current?.focus()
  }, [result])

  const submit = async (submitEvent) => {
    submitEvent.preventDefault()

    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return

    setIsChecking(true)
    setResult(null)

    try {
      const ticket = await adminApi.checkIn(trimmed)
      setResult({ kind: 'ok', ticket })
      setLog((entries) => [{ kind: 'ok', ticket, at: new Date() }, ...entries].slice(0, 25))
    } catch (error) {
      // A 409 means the code is real but already used, worth showing the
      // ticket rather than a bare error, so the door can make a judgement.
      const ticket = error.data ?? null
      setResult({ kind: error.status === 409 ? 'duplicate' : 'error', message: error.message, ticket })
      setLog((entries) =>
        [
          { kind: error.status === 409 ? 'duplicate' : 'error', message: error.message, code: trimmed, at: new Date() },
          ...entries,
        ].slice(0, 25),
      )
    } finally {
      setCode('')
      setIsChecking(false)
    }
  }

  const undo = async (ticketCode) => {
    try {
      await adminApi.undoCheckIn(ticketCode)
      setResult(null)
      setLog((entries) =>
        [{ kind: 'undo', code: ticketCode, at: new Date() }, ...entries].slice(0, 25),
      )
    } catch (error) {
      setResult({ kind: 'error', message: error.message })
    }
  }

  const tone =
    result?.kind === 'ok'
      ? 'border-gold-lift bg-gold/12'
      : result?.kind === 'duplicate'
        ? 'border-velvet bg-velvet-deep/35'
        : 'border-velvet/60 bg-velvet-deep/20'

  return (
    <>
      <AdminHeader
        title="Door check-in"
        description="Type or scan a ticket code to admit a guest."
      />

      <div className="mx-auto max-w-xl">
        <form onSubmit={submit} className="surface p-6">
          <label className="field-label" htmlFor="scan-code">
            Ticket code
          </label>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              id="scan-code"
              className="field font-display text-xl tracking-[0.2em] uppercase"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="LMS-XXXXX-XXXXX"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck="false"
            />
            <button
              type="submit"
              className="btn btn-buy shrink-0"
              disabled={isChecking || !code.trim()}
            >
              {isChecking ? (
                <Loader2 size={16} strokeWidth={1.5} className="animate-spin" />
              ) : (
                <ScanLine size={16} strokeWidth={1.5} />
              )}
              Admit
            </button>
          </div>
          <p className="mt-2 text-xs text-ivory-faint">
            A barcode scanner works here too. It types the code and presses Enter.
          </p>
        </form>

        {result ? (
          <div className={`mt-4 border p-6 text-center ${tone}`} role="status" aria-live="polite">
            {result.kind === 'ok' ? (
              <>
                <span className="mx-auto mb-3 grid size-12 place-items-center rounded-full border border-gold-lift text-gold-lift">
                  <Check size={24} strokeWidth={2} />
                </span>
                <p className="u-display text-3xl">Come in</p>
                <p className="mt-2 text-lg text-ivory">{result.ticket.attendee.name}</p>
                <p className="u-meta mt-1">{result.ticket.ticketType}</p>
                <p className="mt-1 text-xs text-ivory-faint">{result.ticket.eventTitle}</p>

                <button
                  type="button"
                  onClick={() => undo(result.ticket.code)}
                  className="mt-5 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-ivory-dim transition-colors hover:text-ivory"
                >
                  <Undo2 size={12} strokeWidth={1.5} />
                  Undo, that was a mis-scan
                </button>
              </>
            ) : result.kind === 'duplicate' ? (
              <>
                <span className="mx-auto mb-3 grid size-12 place-items-center rounded-full border border-velvet-lift text-velvet-lift">
                  <AlertCircle size={24} strokeWidth={2} />
                </span>
                <p className="u-display text-3xl">Already used</p>
                <p className="mt-2 text-sm text-ivory-dim">{result.message}</p>
                {result.ticket ? (
                  <>
                    <p className="mt-3 text-lg text-ivory">{result.ticket.attendee?.name}</p>
                    <p className="u-meta mt-1">{result.ticket.ticketType}</p>
                  </>
                ) : null}
              </>
            ) : (
              <>
                <span className="mx-auto mb-3 grid size-12 place-items-center rounded-full border border-velvet-lift text-velvet-lift">
                  <X size={24} strokeWidth={2} />
                </span>
                <p className="u-display text-3xl">Not valid</p>
                <p className="mt-2 text-sm text-ivory-dim">{result.message}</p>
              </>
            )}
          </div>
        ) : null}

        {log.length > 0 ? (
          <section className="surface mt-6">
            <h2 className="border-b border-ink-line p-5 font-display text-lg font-semibold">
              Just now
            </h2>
            <ul className="divide-y divide-ink-line">
              {log.map((entry, index) => (
                <li key={index} className="flex items-center justify-between gap-4 px-5 py-3">
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className={`size-1.5 shrink-0 rounded-full ${
                        entry.kind === 'ok'
                          ? 'bg-gold-lift'
                          : entry.kind === 'undo'
                            ? 'bg-royal-lift'
                            : 'bg-velvet-lift'
                      }`}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-ivory">
                        {entry.ticket?.attendee?.name ?? entry.code}
                      </span>
                      <span className="block truncate text-xs text-ivory-faint">
                        {entry.kind === 'ok'
                          ? entry.ticket.ticketType
                          : entry.kind === 'undo'
                            ? 'Check-in undone'
                            : entry.message}
                      </span>
                    </span>
                  </span>
                  <span className="u-meta shrink-0 text-[0.5625rem]">
                    {formatTime(entry.at)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </>
  )
}
