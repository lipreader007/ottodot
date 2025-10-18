import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { z } from 'zod'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const runtime = 'nodejs'

const OUT_SCHEMA = z.object({
  problem_text: z.string().min(10),
  final_answer: z.union([z.number(), z.string()]).transform(Number),
})

export async function POST(_req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing GEMINI_API_KEY' }, { status: 500 })
  }

  const prompt = `Generate ONE Primary 5 (P5) math WORD PROBLEM that requires 2-4 steps
and has a single numeric final answer. Return ONLY JSON with keys:
- problem_text (string)
- final_answer (number)
Do NOT include any prose or code fences.`

  try {
    // ---- Gemini SDK with JSON schema ----
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 256,
        // Forces the model to emit JSON only:
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            problem_text: { type: 'string' },
            final_answer: { type: 'number' },
          },
          required: ['problem_text', 'final_answer'],
        },
      },
    })

    let text = result.response.text() || ''

    // Extra guardrails if the model ever returns fenced/empty output
    text = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/,'').trim()
    if (!text) {
      return NextResponse.json(
        { error: 'Empty response from Gemini' },
        { status: 502 }
      )
    }

    let json: unknown
    try {
      json = JSON.parse(text)
    } catch {
      // last-ditch: try to extract the first {...} block if any
      const m = text.match(/{[\s\S]*}/)
      if (!m) {
        return NextResponse.json(
          { error: 'Model did not return valid JSON', raw: text.slice(0, 1000) },
          { status: 502 }
        )
      }
      json = JSON.parse(m[0])
    }

    const parsed = OUT_SCHEMA.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Schema validation failed', issues: parsed.error.issues, raw: json },
        { status: 400 }
      )
    }

    const supa = supabaseServer()
    const { data: sessionRow, error } = await supa
      .from('math_problem_sessions')
      .insert(parsed.data)
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ session: sessionRow })
  } catch (e: any) {
    // Surface the error so you can see it in Vercel Runtime Logs
    console.error('Gemini generate-problem error:', e?.message || e)
    return NextResponse.json(
      { error: 'Gemini error', details: e?.message || String(e) },
      { status: 502 }
    )
  }
}
