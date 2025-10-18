import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { z } from 'zod'

const OUT_SCHEMA = z.object({
  problem_text: z.string().min(10),
  final_answer: z.union([z.number(), z.string()]).transform((v) => Number(v)),
})

export const runtime = 'nodejs'

export async function POST(_req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Missing GEMINI_API_KEY' }, { status: 500 })

  const prompt = `You are a tutor for a Primary 5 (P5) student in Singapore math.
Generate ONE age-appropriate math WORD PROBLEM that requires 2-4 steps and has a single numeric final answer.
Return ONLY valid JSON with keys: problem_text (string) and final_answer (number), nothing else.
Ensure the final_answer is the exact numeric result.
Example: {"problem_text":"Alice buys 3 boxes...", "final_answer":42}`

  const resp = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' + apiKey, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 256 },
    }),
  })

  if (!resp.ok) {
    const text = await resp.text()
    return NextResponse.json({ error: 'Gemini error', details: text }, { status: 502 })
  }

  const data = await resp.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  let json
  try {
    json = JSON.parse(text)
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON from model', raw: text }, { status: 502 })
  }

  const parsed = OUT_SCHEMA.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Schema validation failed', issues: parsed.error.issues }, { status: 400 })
  }

  const { problem_text, final_answer } = parsed.data

  const supa = supabaseServer()
  const { data: sessionRow, error } = await supa
    .from('math_problem_sessions')
    .insert({ problem_text, final_answer })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ session: sessionRow })
}
