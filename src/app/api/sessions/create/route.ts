import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    interviewId?: string;
    candidateName?: string;
    candidateEmail?: string;
  };

  if (!body.interviewId || !body.candidateName?.trim() || !body.candidateEmail?.trim()) {
    return NextResponse.json(
      { error: "interviewId, candidateName, and candidateEmail are required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("sessions")
    .insert({
      interview_id: body.interviewId,
      candidate_name: body.candidateName.trim(),
      candidate_email: body.candidateEmail.trim(),
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sessionId: data.id });
}
