import { NextResponse } from "next/server";

import { createDefaultInterviewScript, normalizeInterviewScript } from "@/lib/questions";
import { createClient } from "@/lib/server";
import { createAdminClient } from "@/lib/supabase-server";
import { getVoiceAgentById } from "@/lib/voice-agents";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    title?: string;
    questions?: unknown;
    voiceAgentId?: string;
  };

  const title = body.title?.trim();

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const fallbackScript = createDefaultInterviewScript();
  const normalizedScript = normalizeInterviewScript(body.questions ?? fallbackScript.items);
  const voiceAgent = getVoiceAgentById(body.voiceAgentId ?? normalizedScript.voiceAgent.id);

  const questions = normalizedScript.items
    .map((question, index, source) => ({
      id: question.id || `q${index + 1}`,
      phase:
        question.phase ??
        (index === 0 ? "warmup" : index === source.length - 1 ? "closing" : "core"),
      text: question.text.trim(),
      followUp: question.followUp?.text?.trim() ? { text: question.followUp.text.trim() } : null,
      evaluates: Array.isArray(question.evaluates) ? question.evaluates : [],
    }))
    .filter((question) => question.text.length > 0);

  if (questions.length === 0) {
    return NextResponse.json({ error: "Add at least one interview question." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("interviews")
    .insert({
      recruiter_id: user.id,
      title,
      questions: {
        items: questions,
        voiceAgent: {
          id: voiceAgent.id,
          name: voiceAgent.name,
        },
      },
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ interview: data });
}
