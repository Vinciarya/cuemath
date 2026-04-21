export interface Organization {
  id: string;
  clerk_org_id: string;
  name: string;
  created_at: string;
}

export interface Interview {
  id: string;
  org_id: string;
  title: string;
  token: string;
  questions: any;
  status: string;
  created_at: string;
}

export interface Session {
  id: string;
  interview_id: string;
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
  role: 'ai' | 'candidate';
  content: string;
  timestamp: string;
}

export interface DimensionScore {
  score: number;
  reasoning: string;
  quote: string;
}

export interface ScoreCard {
  clarity: DimensionScore;
  warmth: DimensionScore;
  simplicity: DimensionScore;
  patience: DimensionScore;
  fluency: DimensionScore;
}

export type Recommendation = 'strong_yes' | 'yes' | 'no' | 'strong_no';
