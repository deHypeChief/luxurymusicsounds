import { createApp } from './app.ts'
import { env } from './config/env.ts'
import { connectDatabase, disconnectDatabase } from './lib/db.ts'
import { releaseExpiredHolds } from './lib/inventory.ts'

const SWEEP_INTERVAL_MS = 5 * 60 * 1000

async function start() {
  await connectDatabase()

  const app = createApp()
  const server = app.listen(env.port, () => {
    console.log(`[api] Luxury Music Sounds API on http://localhost:${env.port}`)
    console.log(`[api] allowing origins: ${env.corsOrigins.join(', ')}`)
  })

  // Puts stock from abandoned checkouts back on sale.
  const sweeper = setInterval(() => {
    releaseExpiredHolds().catch((error) => console.error('[inventory] sweep failed:', error))
  }, SWEEP_INTERVAL_MS)
  sweeper.unref?.()

  const shutdown = async (signal: string) => {
    console.log(`\n[api] ${signal} received, shutting down`)
    clearInterval(sweeper)
    server.close()
    await disconnectDatabase()
    process.exit(0)
  }

  process.on('SIGINT', () => void shutdown('SIGINT'))
  process.on('SIGTERM', () => void shutdown('SIGTERM'))
}

start().catch((error) => {
  console.error('[api] failed to start:', error)
  process.exit(1)
})
