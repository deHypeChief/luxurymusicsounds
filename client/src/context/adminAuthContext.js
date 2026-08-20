import { createContext, useContext } from 'react'

/**
 * Kept apart from the provider component so that file exports a component and
 * nothing else, which is what React Fast Refresh needs to hot-reload it.
 */
export const AdminAuthContext = createContext(null)

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (!context) {
    throw new Error('useAdminAuth must be used inside an AdminAuthProvider')
  }
  return context
}
