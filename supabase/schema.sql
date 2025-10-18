-- Tables per assessment requirements
create table if not exists public.math_problem_sessions (
  id uuid primary key default gen_random_uuid(),
  problem_text text not null,
  final_answer numeric not null,
  created_at timestamptz not null default now()
);

create table if not exists public.math_problem_submissions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.math_problem_sessions(id) on delete cascade,
  user_answer numeric not null,
  is_correct boolean not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_math_problem_submissions_session on public.math_problem_submissions(session_id);
