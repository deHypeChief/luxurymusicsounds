/**
 * The typographic signature.
 *
 * Display headlines are Bodoni caps with a single word dropped into Pinyon
 * Script. `<Script xl>` scales that word past the cap height so it overlaps the
 * line. It is the one deliberately loud move on the site. Use at most one per
 * headline; the effect stops working the moment it repeats.
 */
export function Script({ children, xl = false, className = '' }) {
  return (
    <span className={`u-script ${xl ? 'u-script-xl' : ''} ${className}`}>{children}</span>
  )
}

export function Eyebrow({ children, className = '' }) {
  return <p className={`u-eyebrow ${className}`}>{children}</p>
}

/**
 * Section marker: a label with a rule running off to the right.
 *
 * These used to carry a roman numeral, as a concert programme would. Nothing
 * on the site is actually read in order, so the numerals were claiming a
 * running order that did not exist. The label stands on its own now.
 */
export function Movement({ label, className = '' }) {
  return (
    <div className={`u-movement ${className}`}>
      <span className="u-eyebrow shrink-0">{label}</span>
    </div>
  )
}

export function SectionTitle({ children, className = '' }) {
  return (
    <h2 className={`u-display text-[length:var(--text-display)] ${className}`}>{children}</h2>
  )
}
