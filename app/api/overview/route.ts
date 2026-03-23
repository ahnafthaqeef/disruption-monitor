import Groq from 'groq-sdk'
import { NextResponse } from 'next/server'

const APAC_ROUTES = [
  'Strait of Malacca',
  'Port Klang, Malaysia',
  'South China Sea',
  'Red Sea / Suez Canal',
  'Trans-Pacific (Asia → US West Coast)',
  'Asia → Europe (via Suez)',
  'Port of Singapore',
  'Port of Shanghai',
  'Lombok Strait, Indonesia',
  'Taiwan Strait',
]

export async function GET() {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

  const today = new Date().toLocaleDateString('en-MY', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const prompt = `You are a senior supply chain risk analyst. Today is ${today}.

Assess the current supply chain disruption risk for each of these APAC trade routes and ports based on your knowledge of current global events, geopolitical conditions, weather patterns, and shipping disruptions.

Routes to assess:
${APAC_ROUTES.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Return ONLY valid JSON (no markdown) with this exact structure:
{
  "routes": [
    {
      "route": "Strait of Malacca",
      "risk_level": "LOW",
      "risk_score": 18,
      "one_liner": "One sentence on the current situation"
    }
  ]
}

Rules:
- risk_level must be exactly one of: LOW, MEDIUM, HIGH, CRITICAL
- risk_score: integer 0-100 (LOW=1-25, MEDIUM=26-50, HIGH=51-75, CRITICAL=76-100)
- one_liner: specific, factual, current — not generic
- Return all ${APAC_ROUTES.length} routes in the same order as listed
- Base assessments on actual current conditions as of ${today}`

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    })
    const text = completion.choices[0].message.content || '{}'
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const data = jsonMatch ? JSON.parse(jsonMatch[0]) : { routes: [] }
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Overview scan failed' }, { status: 500 })
  }
}
