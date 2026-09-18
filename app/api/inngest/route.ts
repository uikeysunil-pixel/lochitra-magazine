import { serve } from 'inngest/next'
import { inngest } from '@/inngest/client'
import { technicalSeoScan } from '@/inngest/technical-seo-scan'

export const runtime = 'nodejs'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [technicalSeoScan],
})
