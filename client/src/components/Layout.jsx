import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Footer from './Footer'
import Header from './Header'

/** Returns to the top on navigation, but leaves in-page anchors alone. */
function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) return
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname, hash])

  return null
}

export default function Layout() {
  return (
    <>
      <ScrollToTop />
      <Header />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
    </>
  )
}
