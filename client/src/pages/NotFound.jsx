import { Link } from 'react-router-dom'
import { Script } from '../components/Typography'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export default function NotFound() {
  useDocumentTitle('Page not found')

  return (
    <div className="wash-royal flex min-h-[100svh] items-center justify-center px-6 py-32 text-center">
      <div>
        <p className="u-eyebrow">Error 404</p>
        <h1 className="u-display mt-6 text-[length:var(--text-hero)]">
          Wrong <Script xl>room</Script>
        </h1>
        <p className="mx-auto mt-8 max-w-md text-lg text-ivory-dim">
          Nothing is playing at this address. The diary is through here.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link to="/events" className="btn btn-solid">
            See what&rsquo;s on
          </Link>
          <Link to="/" className="btn btn-ghost">
            Back to the site
          </Link>
        </div>
      </div>
    </div>
  )
}
