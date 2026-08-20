import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import About from './pages/About'
import EventDetail from './pages/EventDetail'
import Events from './pages/Events'
import GalleryPage from './pages/GalleryPage'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import ThankYou from './pages/ThankYou'

/**
 * The whole site is static. Events and photographs come from files in
 * src/content/, and tickets are sold on Paystack, so there is nothing to fetch
 * and no code worth splitting out of the initial bundle.
 */
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="events" element={<Events />} />
        <Route path="events/:slug" element={<EventDetail />} />
        <Route path="gallery" element={<GalleryPage />} />
        <Route path="about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Where Paystack returns the buyer. Set this as the Payment Page's
          redirect URL: https://<your-domain>/thank-you */}
      <Route path="thank-you" element={<ThankYou />} />
    </Routes>
  )
}
