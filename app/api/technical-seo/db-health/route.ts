import { NextResponse } from 'next/server'
import { sql } from '@/lib/technical-seo/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const rows = await sql`
      select
        1 as database_ok,
        to_regclass('public.seo_scans') as seo_scans_table,
        to_regclass('public.seo_scan_urls') as seo_scan_urls_table,
        to_regclass('public.seo_scan_findings') as seo_scan_findings_table
    `

    const result = rows[0]

    const tablesReady =
      Boolean(result?.seo_scans_table) &&
      Boolean(result?.seo_scan_urls_table) &&
      Boolean(result?.seo_scan_findings_table)

    if (!tablesReady) {
      return NextResponse.json(
        {
          ok: false,
          database: true,
          tables: false,
          error: 'Neon connected, but the Technical SEO tables were not found.',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      database: true,
      tables: true,
      message: 'Locitra is connected to the Technical SEO Neon database.',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to connect to Neon.'

    return NextResponse.json(
      {
        ok: false,
        database: false,
        tables: false,
        error: message,
      },
      { status: 500 }
    )
  }
}
