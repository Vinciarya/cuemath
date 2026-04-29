import { NextResponse } from "next/server";

import { getVoiceAgentById } from "@/lib/voice-agents";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

export async function POST(request: Request) {
  const body = (await request.json()) as {
    text?: string;
    voiceId?: string;
  };

  const text = body.text?.trim();

  if (!text) {
    return NextResponse.json({ error: "Text is required." }, { status: 400 });
  }

  if (text.length > 800) {
    return NextResponse.json({ error: "Text is too long." }, { status: 400 });
  }

  if (!ELEVENLABS_API_KEY) {
    return NextResponse.json(
      {
        error: "ElevenLabs API key is not configured.",
        fallbackToBrowserTts: true,
      },
      { status: 503 }
    );
  }

  const voiceAgent = getVoiceAgentById(body.voiceId);

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceAgent.id}`, {
    method: "POST",
    headers: {
      "xi-api-key": ELEVENLABS_API_KEY,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: voiceAgent.settings.modelId,
      voice_settings: {
        stability: voiceAgent.settings.stability,
        similarity_boost: voiceAgent.settings.similarityBoost,
        style: voiceAgent.settings.style,
        use_speaker_boost: voiceAgent.settings.useSpeakerBoost,
      },
    }),
  });

    if (!response.ok) {
      const errorText = await response.text();
      const lowerError = errorText.toLowerCase();
      
      // Check if it's a known error that we can handle with a fallback
      const isPaymentRequired = response.status === 402;
      const isQuotaExceeded = lowerError.includes("quota") || lowerError.includes("credit");
      const isUnauthorized = response.status === 401;
      
      const shouldFallback =
        isPaymentRequired ||
        isUnauthorized ||
        lowerError.includes("detected_unusual_activity") ||
        lowerError.includes("free tier usage disabled") ||
        isQuotaExceeded;

      if (!shouldFallback) {
        console.error("ElevenLabs API Error:", response.status, errorText);
      }

      return NextResponse.json(
        {
          error: isPaymentRequired 
            ? "Voice limit reached for the current plan." 
            : `ElevenLabs request failed: ${response.status}`,
          fallbackToBrowserTts: shouldFallback,
        },
        { status: shouldFallback ? 503 : 502 }
      );
    }

  const audioBuffer = await response.arrayBuffer();

  return new NextResponse(audioBuffer, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
