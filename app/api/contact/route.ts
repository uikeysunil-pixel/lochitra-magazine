import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, subject, reason, message, botField } = body

    // 1. Honeypot check
    if (botField) {
      // If honeypot is filled, silently ignore and return success to deceive bots
      return NextResponse.json({ success: true })
    }

    // 2. Validation
    if (!name || !email || !subject || !reason || !message) {
      return NextResponse.json(
        { success: false, message: 'All fields are required.' },
        { status: 400 }
      )
    }

    const trimmedEmail = email.trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format.' },
        { status: 400 }
      )
    }

    const apiKey = process.env.BREVO_API_KEY
    console.log("BREVO_API_KEY exists:", !!process.env.BREVO_API_KEY)
    
    if (!apiKey) {
      console.error('Missing BREVO_API_KEY environment variable')
      return NextResponse.json(
        { success: false, message: 'Server configuration error.' },
        { status: 500 }
      )
    }

    // 3. Send email to admin
    const adminEmailPayload = {
      sender: { name: 'Locitra Contact Form', email: 'newsletter@locitra.com' },
      to: [{ email: 'uikeysunil@gmail.com', name: 'Locitra Admin' }],
      cc: [{ email: 'contact@locitra.com', name: 'Locitra Contact' }],
      replyTo: { email: trimmedEmail, name: name },
      subject: `[Locitra Contact] ${subject}`,
      htmlContent: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${trimmedEmail}</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr />
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap;">${message}</p>
        <hr />
        <p><small>Timestamp: ${new Date().toISOString()}</small></p>
      `,
    }

    const adminResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify(adminEmailPayload),
    })

    if (!adminResponse.ok) {
      const errorData = await adminResponse.json()
      console.error('Brevo API Error (Admin Email):', errorData)
      return NextResponse.json(
        { success: false, message: 'Failed to send message. Please try again later.' },
        { status: 500 }
      )
    }

    // 4. Send auto-reply to visitor
    const visitorEmailPayload = {
      sender: { name: 'Sunil from Locitra', email: 'newsletter@locitra.com' },
      to: [{ email: trimmedEmail, name: name }],
      subject: "We've received your message",
      htmlContent: `
        <p>Thank you for contacting Locitra.</p>
        <p>We have received your message and will respond as soon as possible.</p>
        <br />
        <p>— Sunil<br />
        Locitra<br />
        <a href="https://locitra.com">https://locitra.com</a></p>
      `,
    }

    const visitorResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify(visitorEmailPayload),
    })

    if (!visitorResponse.ok) {
      const errorData = await visitorResponse.json()
      console.error('Brevo API Error (Visitor Auto-reply):', errorData)
      // We don't necessarily want to fail the whole request if the auto-reply fails,
      // but we log it. The main message was sent successfully.
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact API Error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 })
  }
}
