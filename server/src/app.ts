import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import morgan from 'morgan'
import { cloudflareEnabled, env, paystackEnabled } from './config/env.ts'
import { errorHandler, notFoundHandler } from './middleware/error.ts'
import adminRouter from './routes/admin/index.ts'
import authRouter from './routes/auth.routes.ts'
import checkoutRouter from './routes/checkout.routes.ts'
import eventsRouter from './routes/events.routes.ts'
import galleryRouter from './routes/gallery.routes.ts'
import settingsRouter from './routes/settings.routes.ts'
import webhooksRouter from './routes/webhooks.routes.ts'

export function createApp() {
  const app = express()

  app.set('trust proxy', 1)
  app.disable('x-powered-by')

  app.use(
    cors({
      origin(origin, callback) {
        // Same-origin and server-to-server calls arrive without an Origin header.
        if (!origin || env.corsOrigins.includes(origin)) {
          callback(null, true)
          return
        }
        callback(new Error(`Origin ${origin} is not allowed by CORS`))
      },
      credentials: true,
    }),
  )

  if (!env.isProd) app.use(morgan('dev'))

  // Mounted before the JSON parser: the Paystack signature covers the raw bytes.
  app.use('/api/webhooks', express.raw({ type: '*/*', limit: '1mb' }), webhooksRouter)

  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ extended: true }))
  app.use(cookieParser())

  app.get('/api/health', (_req, res) => {
    res.json({
      success: true,
      service: 'luxury-music-sounds-api',
      uptime: Math.round(process.uptime()),
      integrations: { paystack: paystackEnabled, cloudflareImages: cloudflareEnabled },
    })
  })

  app.use('/api/auth', authRouter)
  app.use('/api/events', eventsRouter)
  app.use('/api/gallery', galleryRouter)
  app.use('/api/settings', settingsRouter)
  app.use('/api/checkout', checkoutRouter)
  app.use('/api/admin', adminRouter)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
