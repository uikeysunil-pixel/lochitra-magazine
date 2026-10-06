import { headers } from 'next/headers'
import { genPageMetadata } from 'app/seo'
import TechnicalSEOTroubleshooter from '@/components/TechnicalSEOTroubleshooter'

export const metadata = genPageMetadata({
  title: 'Technical SEO Troubleshooter',
  description:
    'Find the technical SEO problems that matter. Enter a website, choose the problem you want to troubleshoot, and get an evidence-based first diagnostic from Locitra.',
  canonicalPath: '/technical-seo',
})

export default async function TechnicalSEOPage() {
  const requestHeaders = await headers()
  const detectedCountry = requestHeaders.get('x-vercel-ip-country')?.toUpperCase() || null

  return (
    <div className="pt-8 pb-16 sm:pt-12">
      <TechnicalSEOTroubleshooter detectedCountry={detectedCountry} />
    </div>
  )
}
