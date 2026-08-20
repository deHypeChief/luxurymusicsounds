/**
 * An empty screen is an invitation to act, so it always offers the next step.
 *
 * There is no loading or error state on this site: events and photographs are
 * bundled with the page, so there is nothing to wait for and nothing to fail.
 */
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
