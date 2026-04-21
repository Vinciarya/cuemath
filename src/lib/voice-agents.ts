import type { VoiceAgent } from "@/types";

export const VOICE_AGENTS: VoiceAgent[] = [
  {
    id: "21m00Tcm4TlvDq8ikWAM",
    name: "Rachel",
    description: "Professional and clear. A standard, reliable choice for screening.",
    previewText:
      "Hello, and welcome to TutorScreen AI for Cuemath. I will guide you through a short voice interview today.",
    settings: {
      modelId: "eleven_turbo_v2",
      stability: 0.4,
      similarityBoost: 0.75,
      style: 0.3,
      useSpeakerBoost: true,
    },
  },
  {
    id: "EXAVITQu4vr4xnSDxMaL",
    name: "Sarah",
    description: "Friendly and natural. Good when you want a softer interviewer tone.",
    previewText:
      "Hi there. Thanks for joining your Cuemath screening interview. Please answer naturally, and take your time.",
    settings: {
      modelId: "eleven_turbo_v2",
      stability: 0.42,
      similarityBoost: 0.78,
      style: 0.32,
      useSpeakerBoost: true,
    },
  },
  {
    id: "XB0fDUnXU5powFXDhCwa",
    name: "Charlotte",
    description: "Confident and interviewer-like. Best for a more formal screening style.",
    previewText:
      "Welcome to the Cuemath tutor screening. I will ask a few questions to understand how you teach and communicate.",
    settings: {
      modelId: "eleven_turbo_v2",
      stability: 0.38,
      similarityBoost: 0.76,
      style: 0.28,
      useSpeakerBoost: true,
    },
  },
];

export const DEFAULT_VOICE_AGENT = VOICE_AGENTS[0];

export function getVoiceAgentById(id?: string | null) {
  return VOICE_AGENTS.find((voiceAgent) => voiceAgent.id === id) ?? DEFAULT_VOICE_AGENT;
}
