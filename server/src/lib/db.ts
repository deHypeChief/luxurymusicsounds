import mongoose from 'mongoose'
import { env } from '../config/env.ts'

mongoose.set('strictQuery', true)

export async function connectDatabase(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) return mongoose

  mongoose.connection.on('connected', () => {
    console.log('[db] connected to MongoDB')
  })
  mongoose.connection.on('error', (error) => {
    console.error('[db] connection error:', error.message)
  })
  mongoose.connection.on('disconnected', () => {
    console.warn('[db] disconnected from MongoDB')
  })

  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 10_000,
    autoIndex: !env.isProd,
  })

  return mongoose
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect()
}
