import { NextResponse } from "next/server";

import { analyzeTranscript } from "@/lib/gemini";
import { createAdminClient } from "@/lib/supabase-server";
import type { ScoreCard, TranscriptEntry } from "@/types";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    sessionId?: string;
    transcript?: TranscriptEntry[];
  };

  if (!body.sessionId || !Array.isArray(body.transcript)) {
    return NextResponse.json(
      { error: "sessionId and transcript are required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  const { data: existingSession, error: sessionError } = await admin
    .from("sessions")
    .select("id, status, scorecard")
    .eq("id", body.sessionId)
    .single();

  if (sessionError) {
    const status = sessionError.code === "PGRST116" ? 404 : 500;
    return NextResponse.json({ error: sessionError.message }, { status });
  }

  if (existingSession.status === "analyzed" && existingSession.scorecard) {
    const isPreviousFailure = (existingSession.scorecard as any).summary?.toLowerCase().includes("failed");
    
    if (!isPreviousFailure) {
      return NextResponse.json({
        scorecard: existingSession.scorecard,
        cached: true,
      });
    }
  }

  console.log(`[Analyze] Starting evaluation for session: ${body.sessionId}`);
  
  // 1. Immediately save the transcript so it's visible in the dashboard
  const { error: transcriptError } = await admin
    .from("sessions")
    .update({ transcript: body.transcript })
    .eq("id", body.sessionId);

  if (transcriptError) {
    console.error(`[Analyze] Failed to save early transcript:`, transcriptError);
  }

  // 2. Perform AI Analysis
  const scorecard = await analyzeTranscript(body.transcript);
  console.log(`[Analyze] Evaluation complete for ${body.sessionId}`);

  // 3. Update the session with the scorecard results
  // Ensure overall_score is a valid integer to avoid "invalid input syntax for type integer"
  const rawScore = scorecard.overall_score;
  const roundedScore = typeof rawScore === 'number' ? Math.round(rawScore) : 
                       typeof rawScore === 'string' ? Math.round(parseFloat(rawScore)) : 1;

  console.log(`[Analyze] Updating database scorecard. Overall: ${roundedScore}`);

  const { error: updateError } = await admin
    .from("sessions")
    .update({
      scorecard,
      overall_score: Number.isNaN(roundedScore) ? 1 : roundedScore,
      recommendation: scorecard.recommendation,
      status: "analyzed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", body.sessionId);

  if (updateError) {
    console.error(`[Analyze] Scorecard update FAILED for ${body.sessionId}:`, updateError);
    return NextResponse.json({ 
      error: updateError.message,
      details: updateError.details,
      code: updateError.code
    }, { status: 500 });
  }

  console.log(`[Analyze] Session ${body.sessionId} fully processed.`);
  return NextResponse.json({ scorecard: scorecard as ScoreCard, cached: false });
}
