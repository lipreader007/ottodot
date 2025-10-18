import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { z } from 'zod'

const IN_SCHEMA = z.object({
  session_id: z.string().uuid(),
  user_answer: z.union([z.number(), z.string()]).transform((v) => Number(v)),
})

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Missing GEMINI_API_KEY' }, { status: 500 })

  const body = await req.json()
  const parsed = IN_SCHEMA.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Bad request', issues: parsed.error.issues }, { status: 400 })
  }
  const { session_id, user_answer } = parsed.data

  const supa = supabaseServer()
  const { data: session, error: sErr } = await supa
    .from('math_problem_sessions')
    .select('*')
    .eq('id', session_id)
    .single()
  if (sErr || !session) return NextResponse.json({ error: sErr?.message || 'Session not found' }, { status: 404 })

  const is_correct = Number(user_answer) === Number(session.final_answer)

  const { data: submission, error: subErr } = await supa
    .from('math_problem_submissions')
    .insert({ session_id, user_answer, is_correct })
    .select('*')
    .single()
  if (subErr) return NextResponse.json({ error: subErr.message }, { status: 500 })

  const feedbackPrompt = `You are a friendly P5 math tutor. The problem was: "${session.problem_text}"
The correct final answer is ${session.final_answer}. The student answered ${user_answer}.
1) Start with brief encouragement.
2) If incorrect, explain the main misconception succinctly, then show a 2–3 step outline to solve it correctly.
3) End with a quick tip related to this problem type.
Limit to 120 words.`

  const resp = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' + apiKey, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: feedbackPrompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 220 },
    }),
  })

  if (!resp.ok) {
    const text = await resp.text()
    return NextResponse.json({ error: 'Gemini error', details: text }, { status: 502 })
  }

  const data = await resp.json()
  const feedback = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Great effort! Keep practicing.'

  return NextResponse.json({ submission, feedback, is_correct })
}
