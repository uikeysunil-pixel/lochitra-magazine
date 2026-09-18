import { neon } from '@neondatabase/serverless'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL must be configured for the Technical SEO database.')
}

export const sql = neon(databaseUrl)
