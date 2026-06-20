import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { LIMAC } from '@/lib/constants'
import type { EnquiryFormData } from '@/lib/types'

const ENQUIRY_FORM_DISABLED = true

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return null
  return new Resend(apiKey)
}

async function saveEnquiryToPayload(data: {
  name: string
  phone: string
  email?: string
  productInterest?: string
  message?: string
}) {
  const payloadURL = process.env.PAYLOAD_URL || process.env.NEXT_PUBLIC_SITE_URL
  if (!payloadURL) return

  const response = await fetch(`${payloadURL}/api/enquiries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.PAYLOAD_API_KEY
        ? { Authorization: `users API-Key ${process.env.PAYLOAD_API_KEY}` }
        : {}),
    },
    body: JSON.stringify({
      ...data,
      source: 'website-form',
    }),
    cache: 'no-store',
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Payload save failed: ${response.status} ${text}`)
  }
}

export async function POST(request: NextRequest) {
  if (ENQUIRY_FORM_DISABLED) {
    return NextResponse.json(
      { error: 'Online enquiry submission is temporarily disabled. Please contact us by WhatsApp or phone.' },
      { status: 503 }
    )
  }

  try {
    const body = await request.json()
    const { name, phone, email, productInterest, message } = body as EnquiryFormData

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Valid name is required' }, { status: 400 })
    }
    if (!phone || typeof phone !== 'string' || !/^[+\d\s-]{10,15}$/.test(phone.trim())) {
      return NextResponse.json({ error: 'Valid phone number is required' }, { status: 400 })
    }

    const enquiryData = {
      name: name.trim(),
      phone: phone.trim(),
      email: email?.trim() ?? '',
      productInterest: productInterest?.trim() ?? '',
      message: message?.trim() ?? '',
      submittedAt: new Date().toISOString(),
    }

    try {
      await saveEnquiryToPayload({
        name: enquiryData.name,
        phone: enquiryData.phone,
        email: enquiryData.email || undefined,
        productInterest: enquiryData.productInterest || undefined,
        message: enquiryData.message || undefined,
      })
    } catch (saveErr) {
      console.error('Payload enquiry save failed:', saveErr)
    }

    // Send notification email to Limac team
    const resend = getResendClient()
    if (resend) {
      try {
        await resend.emails.send({
          from: 'enquiries@limac.in',
          to: [LIMAC.email.info, LIMAC.email.sales],
          subject: `New Enquiry from ${enquiryData.name} — ${enquiryData.productInterest || 'General'}`,
          html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #05142D; padding: 24px; border-radius: 8px 8px 0 0;">
              <h2 style="color: #39D250; margin: 0;">New Enquiry — Limac Power Tech</h2>
            </div>
            <div style="background: #111; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #333;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="color: #999; padding: 8px 0; width: 150px;">Name</td><td style="color: #fff;">${enquiryData.name}</td></tr>
                <tr><td style="color: #999; padding: 8px 0;">Phone</td><td style="color: #fff;"><a href="tel:${enquiryData.phone}" style="color: #39D250;">${enquiryData.phone}</a></td></tr>
                ${enquiryData.email ? `<tr><td style="color: #999; padding: 8px 0;">Email</td><td><a href="mailto:${enquiryData.email}" style="color: #39D250;">${enquiryData.email}</a></td></tr>` : ''}
                ${enquiryData.productInterest ? `<tr><td style="color: #999; padding: 8px 0;">Interest</td><td style="color: #fff;">${enquiryData.productInterest}</td></tr>` : ''}
                ${enquiryData.message ? `<tr><td style="color: #999; padding: 8px 0; vertical-align: top;">Message</td><td style="color: #fff;">${enquiryData.message}</td></tr>` : ''}
                <tr><td style="color: #999; padding: 8px 0;">Submitted</td><td style="color: #fff;">${new Date(enquiryData.submittedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td></tr>
              </table>
              <div style="margin-top: 20px;">
                <a href="https://wa.me/${enquiryData.phone.replace(/[^0-9]/g, '')}" style="background: #25D366; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">
                  Reply via WhatsApp
                </a>
              </div>
            </div>
          </div>
        `,
        })
      } catch (emailErr) {
        console.error('Team notification email failed:', emailErr)
      }
    }

    // Send confirmation email to customer (if email provided)
    if (resend && enquiryData.email) {
      try {
        await resend.emails.send({
          from: 'noreply@limac.in',
          to: [enquiryData.email],
          subject: 'We received your enquiry — Limac Power Tech',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #05142D; padding: 24px; border-radius: 8px 8px 0 0;">
                <h2 style="color: #39D250; margin: 0;">Thank you, ${enquiryData.name}!</h2>
              </div>
              <div style="background: #111; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #333; color: #ccc;">
                <p>We've received your enquiry about <strong style="color: white;">${enquiryData.productInterest || 'our LiFePO4 batteries'}</strong> and our team will get back to you within 24 hours.</p>
                <p>For faster assistance, you can also reach us directly:</p>
                <ul>
                  <li>📞 <a href="tel:${LIMAC.phone.primary.replace(/\s/g, '')}" style="color: #39D250;">${LIMAC.phone.primary}</a></li>
                  <li>💬 <a href="https://wa.me/${LIMAC.whatsapp}" style="color: #39D250;">WhatsApp: +${LIMAC.whatsapp}</a></li>
                </ul>
                <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #333; color: #666; font-size: 12px;">
                  <strong style="color: #fff;">Limac Power Tech</strong><br>
                  ${LIMAC.address.line2}, ${LIMAC.address.city}, ${LIMAC.address.state} — ${LIMAC.address.pincode}
                </div>
              </div>
            </div>
          `,
        })
      } catch (emailErr) {
        console.error('Customer confirmation email failed:', emailErr)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Enquiry API error:', err)
    return NextResponse.json(
      { error: 'Failed to process enquiry. Please try again or contact us directly.' },
      { status: 500 }
    )
  }
}
