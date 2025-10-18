// app/api/generate-problem/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { z } from 'zod'
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'

export const runtime = 'nodejs'

const OUT_SCHEMA = z.object({
  problem_text: z.string().min(10),
  final_answer: z.union([z.number(), z.string()]).transform(Number),
})

export async function POST(_req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Missing GEMINI_API_KEY' }, { status: 500 })

  const prompt = `Generate ONE Primary 5 (P5) math WORD PROBLEM that requires 2-4 steps
and has a single numeric final answer. Return ONLY JSON with keys:
- problem_text (string)
- final_answer (number)
Do NOT include any prose or code fences.`

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 256,
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            problem_text: { type: SchemaType.STRING },
            final_answer: { type: SchemaType.NUMBER },
          },
          required: ['problem_text', 'final_answer'],
        },
      },
    })

    let text = result.response.text() || ''
    text = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '').trim()
    const parsedJson = JSON.parse(text)

    const parsed = OUT_SCHEMA.safeParse(parsedJson)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Schema validation failed', issues: parsed.error.issues, raw: parsedJson },
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
    console.error('Gemini generate-problem error:', e?.message || e)
    return NextResponse.json({ error: 'Gemini error', details: e?.message || String(e) }, { status: 502 })
  }
}
