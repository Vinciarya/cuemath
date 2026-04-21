import "server-only";

import type { ScoreCard, TranscriptEntry } from "@/types";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-1.5-flash";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `You are an expert hiring evaluator for Cuemath, an ed-tech company that hires math tutors. Score the candidate on 5 dimensions (1-10): CLARITY (logical explanation, no jargon), WARMTH (welcoming and encouraging tone), SIMPLICITY (kid-friendly language and analogies), PATIENCE (handles confusion well), FLUENCY (confident natural English). For each dimension give: score (1-10), 1-2 sentence reasoning, one direct quote from the transcript. Then give overall_score as weighted average (clarity 25%, warmth 20%, simplicity 25%, patience 20%, fluency 10%), recommendation ('strong_yes'|'yes'|'no'|'strong_no'), summary (2-3 sentences). Return ONLY valid JSON, no markdown, no backticks.`;

export async function analyzeTranscript(transcript: TranscriptEntry[]): Promise<ScoreCard> {
  const fallbackScoreCard: ScoreCard = {
    dimensions: {
      clarity: { score: 5, reasoning: "Analysis failed.", quote: "" },
      warmth: { score: 5, reasoning: "Analysis failed.", quote: "" },
      simplicity: { score: 5, reasoning: "Analysis failed.", quote: "" },
      patience: { score: 5, reasoning: "Analysis failed.", quote: "" },
      fluency: { score: 5, reasoning: "Analysis failed.", quote: "" },
    },
    overall_score: 5,
    recommendation: "no",
    summary: "Analysis failed - please review transcript manually.",
  };

  if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not defined");
    return fallbackScoreCard;
  }

  const transcriptText = transcript
    .map((entry) => `${entry.role.toUpperCase()}: ${entry.content}`)
    .join("\n");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: SYSTEM_PROMPT }, { text: `Transcript:\n${transcriptText}` }],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) {
      throw new Error("Empty response from Gemini API");
    }

    const cleanJson = textResponse.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson) as ScoreCard;
  } catch (error) {
    console.error("Error analyzing transcript:", error);
    return {
      ...fallbackScoreCard,
      summary: `Analysis failed - System error or empty transcript. Details: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
