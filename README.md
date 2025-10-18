# Ottodot – AI Math Problem Generator (P5)

Tailored UI (logo top-left, brand palette) and **keys injected** for submission.

## Branding
- Replace `/public/Logo Horizontal.png` with your official brand asset (keep the exact filename).

## Supabase (real values)
**Project URL:** `https://hhfizujtpuxxmpbvvjtm.supabase.co`  
**Anon Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoZml6dWp0cHV4eG1wYnZ2anRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MjU3NzAsImV4cCI6MjA3NjMwMTc3MH0.i9K1Mx1RxuIeAup6sFxydN4iljDE94r9PyWT5bCZfOA`

Create `.env.local` (already included) or set in Vercel:

```ini
NEXT_PUBLIC_SUPABASE_URL="https://hhfizujtpuxxmpbvvjtm.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoZml6dWp0cHV4eG1wYnZ2anRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MjU3NzAsImV4cCI6MjA3NjMwMTc3MH0.i9K1Mx1RxuIeAup6sFxydN4iljDE94r9PyWT5bCZfOA"
SUPABASE_SERVICE_ROLE_KEY="<set-in-vercel-server-only>"
GEMINI_API_KEY="<set-in-vercel-server-only>"
```

> The Service Role Key is included in `.env.local` for convenience. DO NOT expose it in the browser. In Vercel, set it as a server-only env var.

## Deploy (Vercel)
- Public vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Server vars: `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

## Notes
- Robust JSON schema validation on AI outputs.
- Sessions & submissions persisted per spec.
- Feedback tuned for P5 students.

> Public repo tip: do **not** commit `.env.local`. Set `GEMINI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` in Vercel as server-only variables.
