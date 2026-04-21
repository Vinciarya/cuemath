import "server-only";

import type { ScoreCard, TranscriptEntry } from "@/types";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GEMINI_MODEL = "gemini-flash-latest";

if (!GEMINI_API_KEY) {
  console.warn("WARNING: GEMINI_API_KEY is not defined in environment variables.");
}

if (!GROQ_API_KEY) {
  console.warn("WARNING: GROQ_API_KEY is not defined in environment variables.");
}

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `You are a professional hiring evaluator for Cuemath. 
Your task: Analyze a math tutor candidate based on an interview transcript.

CRITICAL INSTRUCTIONS:
1. You MUST base your evaluation entirely on the CANDIDATE's actual responses.
2. If the candidate gives short or irrelevant answers, score them accordingly (lower scores).
3. Do NOT hallucinate skills that aren't demonstrated in the text.
4. For every dimension, provide a direct "quote" from the candidate that proves your score.

Dimensions to score (1-10):
- CLARITY: Logic and structure of mathematical explanations.
- WARMTH: Energy, friendliness, and kid-appropriate encouragement.
- SIMPLICITY: Avoiding jargon, using analogies.
- PATIENCE: Handling confusion or follow-up questions.
- FLUENCY: English proficiency and confidence.

Output Format: RETURN ONLY VALID JSON.
{
  "dimensions": {
    "clarity": { "score": 0, "reasoning": "...", "quote": "..." },
    ...
  },
  "overall_score": 0.0,
  "recommendation": "strong_yes | yes | no | strong_no",
  "summary": "..."
}`;

export async function analyzeTranscript(transcript: TranscriptEntry[]): Promise<ScoreCard> {
  const fallbackScoreCard: ScoreCard = {
    dimensions: {
      clarity: { score: 1, reasoning: "Evaluation stalled.", quote: "N/A" },
      warmth: { score: 1, reasoning: "Evaluation stalled.", quote: "N/A" },
      simplicity: { score: 1, reasoning: "Evaluation stalled.", quote: "N/A" },
      patience: { score: 1, reasoning: "Evaluation stalled.", quote: "N/A" },
      fluency: { score: 1, reasoning: "Evaluation stalled.", quote: "N/A" },
    },
    overall_score: 1,
    recommendation: "no",
    summary: "AI evaluation could not be completed.",
    evaluated_by: "System Fallback"
  };

  if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not defined");
    return fallbackScoreCard;
  }

  if (!transcript || transcript.length < 2) {
    return {
      ...fallbackScoreCard,
      summary: "Transcript too short for AI evaluation."
    };
  }

  const transcriptText = transcript
    .map((entry) => `${entry.role.toUpperCase()}: ${entry.content}`)
    .join("\n");

  console.log("--- TRANSCRIPT BEING ANALYZED ---");
  console.log(transcriptText);
  console.log("---------------------------------");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

    if (response.ok) {
      const data = await response.json();
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (textResponse) {
        let cleanedResponse = textResponse.trim();
        if (cleanedResponse.startsWith("```")) {
          cleanedResponse = cleanedResponse.replace(/^```(json)?/, "").replace(/```$/, "").trim();
        }

        try {
          const result = JSON.parse(cleanedResponse) as ScoreCard;
          result.evaluated_by = "Gemini 3 Flash";
          console.log("✅ Gemini Evaluation Success");
          return result;
        } catch (parseError) {
          console.error("Gemini JSON Parse Error:", parseError);
        }
      }
    }
  } catch (error) {
    console.warn("Gemini Error:", error);
  }

  console.log("🚀 Switching to Groq Fallback...");
  try {
    const result = await analyzeTranscriptWithGroq(transcriptText);
    result.evaluated_by = "Groq (Llama 3.3-70b)";
    console.log("✅ Groq Evaluation Success");
    return result;
  } catch (error) {
    console.error("❌ Both AI Providers Failed:", error);
    return fallbackScoreCard;
  }
}

export async function analyzeTranscriptWithGroq(transcriptText: string): Promise<ScoreCard> {
  if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY missing");

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Transcript for Analysis:\n${transcriptText}` },
      ],
      temperature: 0.1,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) throw new Error(`Groq API Error: ${response.status}`);

  const data = await response.json();
  const textResponse = data.choices?.[0]?.message?.content;
  if (!textResponse) throw new Error("Empty Groq response");

  let cleanedResponse = textResponse.trim();
  if (cleanedResponse.startsWith("```")) {
    cleanedResponse = cleanedResponse.replace(/^```(json)?/, "").replace(/```$/, "").trim();
  }

  return JSON.parse(cleanedResponse) as ScoreCard;
}
