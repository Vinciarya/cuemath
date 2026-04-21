export type InterviewPhase = "warmup" | "core" | "closing";
export type Recommendation = "strong_yes" | "yes" | "no" | "strong_no";

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
  evaluated_by?: string;
}

export interface TranscriptEntry {
  role: "ai" | "candidate";
  content: string;
  timestamp: string;
}

export interface InterviewQuestion {
  id: string;
  phase: InterviewPhase;
  text: string;
  followUp: { text: string } | null;
  evaluates: string[];
}

export interface VoiceAgent {
  id: string;
  name: string;
  description: string;
  previewText: string;
  settings: {
    modelId: string;
    stability: number;
    similarityBoost: number;
    style: number;
    useSpeakerBoost: boolean;
  };
}

export interface InterviewScript {
  items: InterviewQuestion[];
  voiceAgent: Pick<VoiceAgent, "id" | "name">;
}

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
  questions: InterviewScript | InterviewQuestion[] | unknown;
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
