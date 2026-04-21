import { NextResponse } from "next/server";

import { createPublicClient } from "@/lib/public-supabase";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("interviews")
    .select("id, title, token, questions, status, created_at")
    .eq("token", token)
    .eq("status", "active")
    .single();

  if (error) {
    const status = error.code === "PGRST116" ? 404 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }

  return NextResponse.json({ interview: data });
}
