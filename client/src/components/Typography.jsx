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
 * Section marker for the home page, which is laid out as a concert programme.
 * The numeral describes a real running order, so it carries information rather
 * than decorating the heading.
 */
export function Movement({ numeral, label, className = '' }) {
  return (
    <div className={`u-movement ${className}`}>
      <span className="u-eyebrow shrink-0">
        {numeral} &nbsp;·&nbsp; {label}
      </span>
    </div>
  )
}

export function SectionTitle({ children, className = '' }) {
  return (
    <h2 className={`u-display text-[length:var(--text-display)] ${className}`}>{children}</h2>
  )
}
