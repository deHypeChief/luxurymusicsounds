import { AlertCircle, Loader2 } from 'lucide-react'

export function Spinner({ label = 'Loading', className = '' }) {
  return (
    <div className={`flex items-center justify-center gap-3 py-20 ${className}`} role="status">
      <Loader2 size={18} strokeWidth={1.5} className="animate-spin text-gold" />
      <span className="u-meta">{label}</span>
    </div>
  )
}

/** Shimmering placeholder used while a grid loads, to keep layout from jumping. */
export function SkeletonCard({ className = '' }) {
  return (
    <div className={`animate-pulse border border-ink-line bg-ink-raised ${className}`}>
      <div className="aspect-[4/3] bg-ink-soft" />
      <div className="space-y-3 p-6">
        <div className="h-2 w-20 bg-ink-soft" />
        <div className="h-5 w-3/4 bg-ink-soft" />
        <div className="h-3 w-1/2 bg-ink-soft" />
      </div>
    </div>
  )
}

export function ErrorState({ error, onRetry, className = '' }) {
  return (
    <div className={`border border-velvet/40 bg-velvet-deep/20 p-8 text-center ${className}`}>
      <AlertCircle size={22} strokeWidth={1.5} className="mx-auto mb-3 text-velvet-lift" />
      <p className="mb-1 font-display text-xl">That did not load</p>
      <p className="mx-auto max-w-sm text-sm text-ivory-dim">
        {error?.message ?? 'Something went wrong on our end.'}
      </p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="btn btn-ghost btn-sm mt-5">
          Try again
        </button>
      ) : null}
    </div>
  )
}

/** An empty screen is an invitation to act, so it always offers the next step. */
export function EmptyState({ title, description, action, icon: Icon, className = '' }) {
  return (
    <div className={`border border-ink-line bg-ink-raised/50 p-12 text-center ${className}`}>
      {Icon ? (
        <Icon size={24} strokeWidth={1.25} className="mx-auto mb-4 text-gold-deep" />
      ) : null}
      <p className="font-display text-2xl">{title}</p>
      {description ? (
        <p className="mx-auto mt-2 max-w-sm text-sm text-ivory-dim">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}
