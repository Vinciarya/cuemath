import "server-only";

import type { ScoreCard, TranscriptEntry } from "@/types";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-flash-latest";

if (!GEMINI_API_KEY) {
  console.warn("WARNING: GEMINI_API_KEY is not defined in environment variables.");
}

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `You are a high-level hiring evaluator for Cuemath. Your task is to provide a professional, deep, and constructive evaluation of a math tutor candidate based on their interview transcript.

Score the candidate across 5 key dimensions (1-10):
1. CLARITY: Ability to explain complex math concepts simply and logically.
2. WARMTH: Friendly, welcoming, and encouraging tone suitable for kids.
3. SIMPLICITY: Use of relatable analogies and avoiding technical jargon.
4. PATIENCE: How they handle follow-up questions or student confusion.
5. FLUENCY: General communication skills and confidence in English.

For every dimension, provide:
- score (1-10)
- reasoning (1-2 sharp, professional sentences)
- quote (the most representative direct quote from the transcript)

Then provide:
- overall_score: Weighted average (Clarity 25%, Warmth 20%, Simplicity 25%, Patience 20%, Fluency 10%) rounded to 1 decimal.
- recommendation: Exactly one of 'strong_yes', 'yes', 'no', or 'strong_no'.
- summary: A clear, executive 3-4 sentence summary of the candidate's performance, highlighting their biggest strength and potential areas for growth.

RETURN ONLY VALID JSON. Do not include markdown code blocks.`;

export async function analyzeTranscript(transcript: TranscriptEntry[]): Promise<ScoreCard> {
  const fallbackScoreCard: ScoreCard = {
    dimensions: {
      clarity: { score: 1, reasoning: "Evaluation could not be generated due to insufficient data or technical error.", quote: "N/A" },
      warmth: { score: 1, reasoning: "Evaluation could not be generated due to insufficient data or technical error.", quote: "N/A" },
      simplicity: { score: 1, reasoning: "Evaluation could not be generated due to insufficient data or technical error.", quote: "N/A" },
      patience: { score: 1, reasoning: "Evaluation could not be generated due to insufficient data or technical error.", quote: "N/A" },
      fluency: { score: 1, reasoning: "Evaluation could not be generated due to insufficient data or technical error.", quote: "N/A" },
    },
    overall_score: 1,
    recommendation: "no",
    summary: "AI evaluation stalled. This usually happens if the transcript is too short or the conversation was disconnected prematurely. Please review the manual transcript logs.",
  };

  if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not defined");
    return fallbackScoreCard;
  }

  // Filter out very short or empty transcripts to avoid API errors
  if (!transcript || transcript.length < 2) {
    return {
      ...fallbackScoreCard,
      summary: "Transcript is too short to provide a meaningful AI evaluation. Minimum 2 dialogue turns required."
    };
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
            parts: [{ text: SYSTEM_PROMPT }, { text: `Transcript for Analysis:\n${transcriptText}` }],
          },
        ],
        generationConfig: {
          response_mime_type: "application/json",
          temperature: 0.1,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Gemini API error (${response.status}): ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) {
      throw new Error("No text response in Gemini payload");
    }

    return JSON.parse(textResponse) as ScoreCard;
  } catch (error) {
    console.error("Critical error in analyzeTranscript:", error);
    return {
      ...fallbackScoreCard,
      summary: `AI Evaluation Error: ${error instanceof Error ? error.message : "The system encountered an unexpected bottleneck. Please check the transcript manually."}`
    };
  }
}
