import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 })
    }

    const trimmedEmail = email.trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json({ success: false, message: 'Invalid email format' }, { status: 400 })
    }

    const apiKey = process.env.BREVO_API_KEY
    const listId = process.env.BREVO_LIST_ID

    if (!apiKey || !listId) {
      console.error('Missing Brevo environment variables')
      return NextResponse.json(
        { success: false, message: 'Server configuration error' },
        { status: 500 }
      )
    }

    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: trimmedEmail,
        listIds: [parseInt(listId, 10)],
      }),
    })

    if (!response.ok) {
      const data = await response.json()
      // Brevo returns duplicate_parameter if the contact already exists
      if (data.code === 'duplicate_parameter') {
        return NextResponse.json({ success: true, message: 'already subscribed' })
      }

      console.error('Brevo API Error:', data)
      return NextResponse.json({ success: false, message: 'Subscription failed' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Newsletter API Error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
