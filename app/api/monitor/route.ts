import Groq from 'groq-sdk'
import { NextRequest, NextResponse } from 'next/server'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

interface SerperResult {
  title: string
  snippet: string
  link: string
  source?: string
  date?: string
}

async function fetchNews(query: string): Promise<SerperResult[]> {
  const res = await fetch('https://google.serper.dev/news', {
    method: 'POST',
    headers: {
      'X-API-KEY': process.env.SERPER_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: `${query} supply chain shipping disruption logistics`,
      num: 8,
      tbs: 'qdr:m',
    }),
  })
  const data = await res.json()
  return (data.news || []).slice(0, 6)
}

export async function POST(req: NextRequest) {
  const { route } = await req.json()

  if (!route) {
    return NextResponse.json({ error: 'Route is required' }, { status: 400 })
  }

  let newsItems: SerperResult[] = []
  let newsContext = 'No recent news data available.'

  try {
    newsItems = await fetchNews(route)
    if (newsItems.length > 0) {
      newsContext = newsItems
        .map((n, i) => `${i + 1}. ${n.title}\n   ${n.snippet}`)
        .join('\n\n')
    }
  } catch {
    // continue with AI analysis even if news fetch fails
  }

  const today = new Date().toLocaleDateString('en-MY', {
    day: 'numeric', month: 'long', year: 'numeric'
  })

  const prompt = `You are a senior supply chain risk analyst specialising in APAC logistics. Today is ${today}.

Assess the current supply chain disruption risk for: ${route}

Recent news and events:
${newsContext}

Use your knowledge of current global trade conditions, geopolitical factors, weather patterns, port congestion, and shipping lane risks to provide a comprehensive assessment.

Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "risk_level": "MEDIUM",
  "risk_score": 45,
  "summary": "3-4 sentence situation summary covering what is happening and why it matters for logistics",
  "active_disruptions": [
    "Specific disruption 1 with context",
    "Specific disruption 2 with context"
  ],
  "affected_commodities": ["Electronics", "Crude Oil", "LNG", "Container Cargo"],
  "impact_assessment": "2-3 sentences on the specific operational impact on shipping times, costs, and capacity for this route",
  "mitigations": [
    "Specific mitigation action 1",
    "Specific mitigation action 2",
    "Specific mitigation action 3",
    "Specific mitigation action 4"
  ],
  "outlook": "2-3 sentences on expected trajectory — will this improve, worsen, or stabilise over the next 30-60 days",
  "news": [
    {"title": "Headline", "snippet": "Brief summary", "source": "Source name", "date": "Date if known"}
  ]
}

Rules:
- risk_level must be exactly one of: LOW, MEDIUM, HIGH, CRITICAL
- risk_score: integer 0-100 matching the risk level (LOW=1-25, MEDIUM=26-50, HIGH=51-75, CRITICAL=76-100)
- active_disruptions: list of specific, real current issues (empty array if genuinely none)
- affected_commodities: commodities most impacted by disruptions on this route
- Use the news provided above for the news array — if no news was provided, include your knowledge of recent events
- Be specific, factual, and actionable — no vague generics
- If ${route} is a specific port, focus on that port's conditions, congestion, and regional factors`

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    })
    const text = completion.choices[0].message.content || '{}'
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const data = jsonMatch ? JSON.parse(jsonMatch[0]) : {}

    // Merge real news into the response if available
    if (newsItems.length > 0 && (!data.news || data.news.length === 0)) {
      data.news = newsItems.map(n => ({
        title: n.title,
        snippet: n.snippet,
        source: n.source || '',
        date: n.date || '',
      }))
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Monitor check failed' }, { status: 500 })
  }
}
