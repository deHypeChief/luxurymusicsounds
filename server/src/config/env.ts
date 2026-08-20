import 'dotenv/config'

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function optional(name: string, fallback = ''): string {
  return process.env[name] ?? fallback
}

export const env = {
  nodeEnv: optional('NODE_ENV', 'development'),
  isProd: optional('NODE_ENV', 'development') === 'production',
  port: Number(optional('PORT', '4000')),

  mongoUri: required('MONGODB_URI', 'mongodb://127.0.0.1:27017/luxurymusicsounds'),

  jwtSecret: required('JWT_SECRET', 'dev-only-insecure-secret-change-me'),
  jwtExpiresIn: optional('JWT_EXPIRES_IN', '7d'),
  cookieName: optional('AUTH_COOKIE_NAME', 'lms_admin'),
  cookieDomain: optional('COOKIE_DOMAIN'),

  clientUrl: optional('CLIENT_URL', 'http://localhost:5173'),
  corsOrigins: optional('CORS_ORIGINS', 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),

  paystack: {
    secretKey: optional('PAYSTACK_SECRET_KEY'),
    publicKey: optional('PAYSTACK_PUBLIC_KEY'),
    baseUrl: optional('PAYSTACK_BASE_URL', 'https://api.paystack.co'),
    currency: optional('PAYSTACK_CURRENCY', 'NGN'),
  },

  cloudflare: {
    accountId: optional('CLOUDFLARE_ACCOUNT_ID'),
    apiToken: optional('CLOUDFLARE_IMAGES_TOKEN'),
    accountHash: optional('CLOUDFLARE_ACCOUNT_HASH'),
    defaultVariant: optional('CLOUDFLARE_IMAGE_VARIANT', 'public'),
  },

  seed: {
    adminEmail: optional('SEED_ADMIN_EMAIL', 'admin@luxurymusicsounds.com'),
    adminPassword: optional('SEED_ADMIN_PASSWORD', 'ChangeMe!2026'),
    adminName: optional('SEED_ADMIN_NAME', 'Israel Peter'),
  },
}

export const paystackEnabled = Boolean(env.paystack.secretKey)
export const cloudflareEnabled = Boolean(env.cloudflare.accountId && env.cloudflare.apiToken)
