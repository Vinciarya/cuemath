import { NextResponse } from "next/server";

import { CUEMATH_QUESTIONS } from "@/lib/questions";
import { createClient } from "@/lib/server";
import { createAdminClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { title?: string };
  const title = body.title?.trim();

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("interviews")
    .insert({
      recruiter_id: user.id,
      title,
      questions: CUEMATH_QUESTIONS,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ interview: data });
}
