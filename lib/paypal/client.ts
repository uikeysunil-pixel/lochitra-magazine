import { Client, Environment } from '@paypal/paypal-server-sdk'

function getRequiredEnv(name: 'PAYPAL_CLIENT_ID' | 'PAYPAL_CLIENT_SECRET') {
  const value = process.env[name]

  if (!value) {
    throw new Error(`${name} must be configured.`)
  }

  return value
}

const isLive = process.env.PAYPAL_ENVIRONMENT?.toLowerCase() === 'live'

export const paypalClient = new Client({
  clientCredentialsAuthCredentials: {
    oAuthClientId: getRequiredEnv('PAYPAL_CLIENT_ID'),
    oAuthClientSecret: getRequiredEnv('PAYPAL_CLIENT_SECRET'),
  },
  environment: isLive ? Environment.Production : Environment.Sandbox,
})
