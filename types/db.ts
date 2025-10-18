export type SessionRow = {
  id: string
  problem_text: string
  final_answer: number
  created_at: string
}

export type SubmissionRow = {
  id: string
  session_id: string
  user_answer: number
  is_correct: boolean
  created_at: string
}
