import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { z } from 'zod'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const runtime = 'nodejs' // important: server runtime

const OUT_SCHEMA = z.object({
  problem_text: z.string().min(10),
  final_answer: z.union([z.number(), z.string()]).transform(Number),
})

export async function POST(_req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing GEMINI_API_KEY' }, { status: 500 })
  }

  const prompt = `You are a tutor for a Primary 5 (P5) student in Singapore math.
Generate ONE age-appropriate math WORD PROBLEM that requires 2-4 steps and has a single numeric final answer.
Return ONLY valid JSON with keys: problem_text (string) and final_answer (number), nothing else.
Ensure the final_answer is the exact numeric result.
Example: {"problem_text":"Alice buys 3 boxes...", "final_answer":42}`

  // --- Gemini SDK ---
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  const result = await model.generateContent(prompt)
  let text = result.response.text() || ''

  // strip accidental code fences then parse
  text = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/,'').trim()

  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: 'Model did not return valid JSON', raw: text }, { status: 502 })
  }

  const parsed = OUT_SCHEMA.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Schema validation failed', issues: parsed.error.issues, raw: json }, { status: 400 })
  }

  const supa = supabaseServer()
  const { data: sessionRow, error } = await supa
    .from('math_problem_sessions')
    .insert(parsed.data)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ session: sessionRow })
}
