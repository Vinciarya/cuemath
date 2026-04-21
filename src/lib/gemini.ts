import type { Dimension, ScoreCard, TranscriptEntry } from "@/types";

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

const SYSTEM_PROMPT =
  "You are an expert hiring evaluator for Cuemath, an ed-tech company that hires math tutors. Score the candidate on 5 dimensions (1-10): CLARITY (logical explanation, no jargon), WARMTH (welcoming and encouraging tone), SIMPLICITY (kid-friendly language and analogies), PATIENCE (handles confusion well), FLUENCY (confident natural English). For each dimension give: score (1-10), 1-2 sentence reasoning, one direct quote from the transcript. Then give overall_score as weighted average (clarity 25%, warmth 20%, simplicity 25%, patience 20%, fluency 10%), recommendation ('strong_yes'|'yes'|'no'|'strong_no'), summary (2-3 sentences). Return ONLY valid JSON, no markdown, no backticks.";

function fallbackScoreCard(): ScoreCard {
  const fallbackDimension: Dimension = {
    score: 5,
    reasoning: "Analysis failed — please review transcript manually.",
    quote: "",
  };

  return {
    dimensions: {
      clarity: { ...fallbackDimension },
      warmth: { ...fallbackDimension },
      simplicity: { ...fallbackDimension },
      patience: { ...fallbackDimension },
      fluency: { ...fallbackDimension },
    },
    overall_score: 5,
    recommendation: "no",
    summary: "Analysis failed — please review transcript manually.",
  };
}

function stripMarkdownFences(value: string): string {
  return value.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

function extractResponseText(payload: unknown): string {
  const text =
    (payload as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            text?: string;
          }>;
        };
      }>;
    })?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("") ?? "";

  return stripMarkdownFences(text);
}

export async function analyzeTranscript(
  transcript: TranscriptEntry[]
): Promise<ScoreCard> {
  try {
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [
            {
              text: SYSTEM_PROMPT,
            },
          ],
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Transcript:\n${JSON.stringify(transcript)}`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini request failed with status ${response.status}`);
    }

    const payload = await response.json();
    const rawText = extractResponseText(payload);

    if (!rawText) {
      throw new Error("Gemini returned an empty response");
    }

    return JSON.parse(rawText) as ScoreCard;
  } catch {
    return fallbackScoreCard();
  }
}
