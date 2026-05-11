import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { LIMAC } from '@/lib/constants'
import type { ChatMessage } from '@/lib/types'
import { getProducts } from '@/lib/payload'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const buildSystemPrompt = (productsSummary: string) => `You are a helpful assistant for Limac Power Tech, Kerala's trusted LiFePO4 battery specialists based in Thrissur, Kerala, India.

COMPANY DETAILS:
- Name: ${LIMAC.name}
- Location: ${LIMAC.address.line1}, ${LIMAC.address.line2}, ${LIMAC.address.city}, ${LIMAC.address.state} ${LIMAC.address.pincode}
- Phone: ${LIMAC.phone.primary}, ${LIMAC.phone.secondary}, ${LIMAC.phone.tertiary}
- Email: ${LIMAC.email.info}, ${LIMAC.email.sales}
- WhatsApp: +${LIMAC.whatsapp}
- Founded: ${LIMAC.founded}
- Installations: 50,000+ across Kerala

PRODUCTS:
${productsSummary}

GUIDELINES:
- Be helpful, concise, and professional
- Focus on LiFePO4 batteries, solar storage, Electric scooter batteries, and related topics
- Always mention that customers can call or WhatsApp ${LIMAC.phone.primary} for detailed pricing
- For technical questions, provide accurate LiFePO4 chemistry information
- Respond in the language the customer uses (Malayalam, Tamil, or English)
- Keep responses under 150 words unless detailed technical explanation is needed
- If you don't know something specific, direct them to contact Limac directly`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages } = body as { messages: ChatMessage[] }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 })
    }

    const validatedMessages = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: String(m.content).slice(0, 2000), // Limit message length
      }))

    if (validatedMessages.length === 0) {
      return NextResponse.json({ error: 'No valid messages' }, { status: 400 })
    }

    const products = await getProducts()
    const productsSummary =
      products.length > 0
        ? products
            .map(
              (product) =>
                `- ${product.name}: ${product.specsGroup.voltage}, ${product.specsGroup.capacity}, ${product.specsGroup.cycleLife} cycle life, ${product.specsGroup.warranty} warranty`
            )
            .join('\n')
        : '- Product catalog is currently being updated. Ask customer to call for latest availability.'

    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      system: buildSystemPrompt(productsSummary),
      messages: validatedMessages,
    })

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              controller.enqueue(new TextEncoder().encode(chunk.delta.text))
            }
          }
          controller.close()
        } catch (err) {
          controller.error(err)
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (err) {
    console.error('Chat API error:', err)
    return NextResponse.json(
      {
        error: `Sorry, I'm unavailable right now. Please call us at ${LIMAC.phone.primary} for immediate assistance.`,
      },
      { status: 500 }
    )
  }
}
