import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { Spinner } from './components/States'
import About from './pages/About'
import EventDetail from './pages/EventDetail'
import Events from './pages/Events'
import GalleryPage from './pages/GalleryPage'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import TicketConfirm from './pages/TicketConfirm'

/**
 * The admin panel is loaded on demand. It is a large amount of code that no
 * ticket buyer will ever run, so keeping it out of the initial bundle is the
 * single biggest thing we can do for the public site's load time.
 */
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminEventEditor = lazy(() => import('./pages/admin/AdminEventEditor'))
const AdminEvents = lazy(() => import('./pages/admin/AdminEvents'))
const AdminGallery = lazy(() => import('./pages/admin/AdminGallery'))
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'))
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'))
const AdminScanner = lazy(() => import('./pages/admin/AdminScanner'))
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'))

export default function App() {
  return (
    <Suspense fallback={<Spinner label="Loading" className="min-h-[100svh]" />}>
      <Routes>
        {/* Public site */}
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="events" element={<Events />} />
          <Route path="events/:slug" element={<EventDetail />} />
          <Route path="gallery" element={<GalleryPage />} />
          <Route path="about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Sits outside the layout: no site chrome around a payment result. */}
        <Route path="/tickets/confirm" element={<TicketConfirm />} />

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="events" element={<AdminEvents />} />
          <Route path="events/new" element={<AdminEventEditor />} />
          <Route path="events/:id" element={<AdminEventEditor />} />
          <Route path="gallery" element={<AdminGallery />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="door" element={<AdminScanner />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
