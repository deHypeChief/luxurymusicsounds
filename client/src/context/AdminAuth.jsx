import { useCallback, useMemo, useRef, useState } from 'react'
import { adminApi } from '../lib/api'
import { AdminAuthContext } from './adminAuthContext'

/**
 * Holds the signed-in admin.
 *
 * The session lives in an httpOnly cookie the browser cannot read, so we have
 * to ask the API who we are. That check is deliberately lazy: only admin
 * screens call `ensureSession`, which keeps a pointless (and 401-logging)
 * request off every public page load. The in-flight promise is shared so two
 * components mounting together produce one request, not two.
 */
export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [status, setStatus] = useState('idle')

  const pending = useRef(null)

  const ensureSession = useCallback(() => {
    if (status === 'ready') return Promise.resolve(admin)
    if (pending.current) return pending.current

    setStatus('checking')

    pending.current = adminApi
      .me()
      .then((data) => {
        setAdmin(data)
        return data
      })
      .catch(() => {
        // A 401 here just means "not signed in", which is the normal case.
        setAdmin(null)
        return null
      })
      .finally(() => {
        setStatus('ready')
        pending.current = null
      })

    return pending.current
  }, [admin, status])

  const signIn = useCallback(async (email, password) => {
    const data = await adminApi.login(email, password)
    setAdmin(data)
    setStatus('ready')
    return data
  }, [])

  const signOut = useCallback(async () => {
    await adminApi.logout().catch(() => undefined)
    setAdmin(null)
    setStatus('ready')
  }, [])

  const value = useMemo(
    () => ({
      admin,
      isResolving: status !== 'ready',
      isSignedIn: Boolean(admin),
      ensureSession,
      signIn,
      signOut,
    }),
    [admin, status, ensureSession, signIn, signOut],
  )

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

