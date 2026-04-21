export interface Recruiter {
  id: string;
  email: string;
  name?: string | null;
  created_at: string;
}

export interface Interview {
  id: string;
  recruiter_id?: string | null;
  title: string;
  token: string;
  questions: unknown;
  status: string;
  created_at: string;
}

export interface Session {
  id: string;
  interview_id?: string | null;
  candidate_name?: string | null;
  candidate_email?: string | null;
  transcript?: TranscriptEntry[] | null;
  scorecard?: ScoreCard | null;
  overall_score?: number | null;
  recommendation?: Recommendation | null;
  status: string;
  started_at: string;
  completed_at?: string | null;
  duration_seconds?: number | null;
}

export interface TranscriptEntry {
  role: "ai" | "candidate";
  content: string;
  timestamp: string;
}

export interface Dimension {
  score: number;
  reasoning: string;
  quote: string;
}

export interface ScoreCard {
  dimensions: {
    clarity: Dimension;
    warmth: Dimension;
    simplicity: Dimension;
    patience: Dimension;
    fluency: Dimension;
  };
  overall_score: number;
  recommendation: Recommendation;
  summary: string;
}

export type Recommendation = "strong_yes" | "yes" | "no" | "strong_no";
