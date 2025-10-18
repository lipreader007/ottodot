'use client'

import { useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'
import type { SessionRow } from '@/types/db'

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [session, setSession] = useState<SessionRow | null>(null)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const generate = async () => {
    setLoading(true)
    setFeedback(null)
    setAnswer('')
    try {
      const res = await fetch('/api/generate-problem', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to generate problem')
      setSession(json.session)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  const submit = async () => {
    if (!session) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/generate-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: session.id, user_answer: Number(answer) }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to submit answer')
      setFeedback(json.feedback)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">AI Math Problem Generator (P5)</h1>
        <button onClick={generate} disabled={loading} className="btn-primary">
          {loading ? 'Generating…' : 'Generate New Problem'}
        </button>
      </header>

      <section className="card p-4">
        {!session && <p className="text-gray-600">Click <em>Generate New Problem</em> to get started.</p>}
        {session && (
          <div className="space-y-4">
            <p className="whitespace-pre-wrap text-lg">{session.problem_text}</p>

            <div className="flex items-center gap-3">
              <input
                type="number"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-40 rounded-lg border border-gray-300 px-3 py-2"
                placeholder="Your answer"
              />
              <button onClick={submit} disabled={submitting || !answer} className="btn-accent">
                {submitting ? 'Submitting…' : 'Submit Answer'}
              </button>
            </div>

            {feedback && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="font-medium">Personalized Feedback</p>
                <p className="mt-1 whitespace-pre-wrap">{feedback}</p>
              </div>
            )}
          </div>
        )}
      </section>

      <History />
    </main>
  )
}

function History() {
  const supa = supabaseBrowser()
  const [rows, setRows] = useState<SessionRow[]>([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    const { data, error } = await supa.from('math_problem_sessions').select('*').order('created_at', { ascending: false }).limit(10)
    if (!error && data) setRows(data as any)
    setLoading(false)
  }

  return (
    <section className="card p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recent Problems</h2>
        <button onClick={load} className="rounded-lg border px-3 py-1">{loading ? 'Loading…' : 'Refresh'}</button>
      </div>
      {rows.length === 0 ? (
        <p className="text-gray-600">No history yet.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id} className="rounded-lg border p-3">
              <div className="text-sm text-gray-500">{new Date(r.created_at).toLocaleString()}</div>
              <div className="line-clamp-2">{r.problem_text}</div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
