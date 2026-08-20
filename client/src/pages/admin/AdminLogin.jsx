import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Script } from '../../components/Typography'
import { Spinner } from '../../components/States'
import { useAdminAuth } from '../../context/adminAuthContext'

export default function AdminLogin() {
  const { ensureSession, isSignedIn, isResolving, signIn } = useAdminAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Someone already signed in should not be shown the form again.
  useEffect(() => {
    ensureSession()
  }, [ensureSession])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isResolving) return <Spinner label="Checking your session" className="min-h-[100svh]" />
  if (isSignedIn) return <Navigate to={location.state?.from ?? '/admin'} replace />

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      await signIn(email.trim(), password)
      navigate(location.state?.from ?? '/admin', { replace: true })
    } catch (caught) {
      setError(caught.message)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="wash-royal flex min-h-[100svh] items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <Link to="/" className="inline-block">
            <span className="u-script block text-4xl leading-none">Luxury</span>
            <span className="u-display mt-2 block text-xs tracking-[0.32em] text-ivory-dim">
              MUSIC SOUNDS
            </span>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="surface p-8">
          <h1 className="u-display text-3xl">
            Sign <Script>in</Script>
          </h1>
          <p className="mt-2 text-sm text-ivory-dim">
            Manage events, tickets and the gallery.
          </p>

          <div className="mt-8 space-y-4">
            <div>
              <label className="field-label" htmlFor="admin-email">
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                className="field"
                value={email}
                onChange={(changeEvent) => setEmail(changeEvent.target.value)}
                autoComplete="username"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="field-label" htmlFor="admin-password">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                className="field"
                value={password}
                onChange={(changeEvent) => setPassword(changeEvent.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          {error ? (
            <p
              role="alert"
              className="mt-5 border border-velvet/50 bg-velvet-deep/25 px-4 py-3 text-sm"
            >
              {error}
            </p>
          ) : null}

          <button type="submit" className="btn btn-solid mt-7 w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 size={15} strokeWidth={1.5} className="animate-spin" />
                Signing in
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <p className="mt-6 text-center">
          <Link to="/" className="u-meta transition-colors hover:text-gold-lift">
            ← Back to the site
          </Link>
        </p>
      </div>
    </div>
  )
}
