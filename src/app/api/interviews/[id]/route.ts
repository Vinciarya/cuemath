import { NextResponse } from "next/server";

import { createClient } from "@/lib/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const { data: interview, error: interviewError } = await supabase
    .from("interviews")
    .select("*")
    .eq("id", id)
    .eq("recruiter_id", user.id)
    .single();

  if (interviewError) {
    const status = interviewError.code === "PGRST116" ? 404 : 500;
    return NextResponse.json({ error: interviewError.message }, { status });
  }

  const { data: sessions, error: sessionsError } = await supabase
    .from("sessions")
    .select("*")
    .eq("interview_id", id)
    .order("started_at", { ascending: false });

  if (sessionsError) {
    return NextResponse.json({ error: sessionsError.message }, { status: 500 });
  }

  return NextResponse.json({
    interview,
    sessions: sessions ?? [],
  });
}
