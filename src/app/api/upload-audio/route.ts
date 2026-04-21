import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const sessionId = formData.get("sessionId") as string;
    const audioFile = formData.get("audio") as File;

    if (!sessionId || !audioFile) {
      return NextResponse.json({ error: "Missing sessionId or audio file" }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1. Upload to Supabase Storage
    const fileName = `${sessionId}.webm`;
    const { data: uploadData, error: uploadError } = await admin.storage
      .from("interview-audio")
      .upload(fileName, audioFile, {
        contentType: "audio/webm",
        upsert: true,
      });

    if (uploadError) {
      // If bucket doesn't exist, we might need to handle it or just log it
      console.error("Storage upload error:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // 2. Get Public URL
    const { data: { publicUrl } } = admin.storage
      .from("interview-audio")
      .getPublicUrl(fileName);

    // 3. Update Session Record with audio_url
    const { error: updateError } = await admin
      .from("sessions")
      .update({ audio_url: publicUrl })
      .eq("id", sessionId);

    if (updateError) {
      console.error("Session update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error) {
    console.error("Upload handler error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
