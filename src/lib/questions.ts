import type { InterviewPhase, InterviewQuestion, InterviewScript } from "@/types";

import { DEFAULT_VOICE_AGENT, getVoiceAgentById } from "@/lib/voice-agents";

export const CUEMATH_QUESTIONS: InterviewQuestion[] = [
  {
    id: "q1",
    phase: "warmup",
    text: "Hi! Welcome to Cuemath's tutor screening. I'm your AI interviewer today. To start, could you tell me a little about yourself and why you're interested in tutoring with Cuemath?",
    followUp: {
      text: "What age groups have you worked with before, if any?",
    },
    evaluates: ["warmth", "fluency"],
  },
  {
    id: "q2",
    phase: "core",
    text: "Here's a scenario: a 9-year-old student looks confused and says they don't understand fractions at all. How would you explain what a fraction is to them?",
    followUp: {
      text: "Can you give me a real-world example you'd use?",
    },
    evaluates: ["simplicity", "clarity", "patience"],
  },
  {
    id: "q3",
    phase: "core",
    text: "Imagine a student has been staring at a problem for 5 minutes and is getting frustrated. They say, I'm just bad at math. What do you do?",
    followUp: {
      text: "How do you keep them motivated without just giving them the answer?",
    },
    evaluates: ["patience", "warmth"],
  },
  {
    id: "q4",
    phase: "core",
    text: "How would you explain the concept of multiplication to a child who only understands addition so far?",
    followUp: null,
    evaluates: ["simplicity", "clarity"],
  },
  {
    id: "q5",
    phase: "closing",
    text: "Last question - what do you think makes a truly great math tutor? Not just a good one, but someone a student will remember years later.",
    followUp: null,
    evaluates: ["warmth", "clarity"],
  },
];

export function createDefaultInterviewScript(): InterviewScript {
  return {
    items: CUEMATH_QUESTIONS.map((question) => ({
      ...question,
      followUp: question.followUp ? { ...question.followUp } : null,
      evaluates: [...question.evaluates],
    })),
    voiceAgent: {
      id: DEFAULT_VOICE_AGENT.id,
      name: DEFAULT_VOICE_AGENT.name,
    },
  };
}

function getPhaseForIndex(index: number, count: number): InterviewPhase {
  if (index === 0) {
    return "warmup";
  }

  if (index === count - 1) {
    return "closing";
  }

  return "core";
}

function isQuestionLike(value: unknown): value is Partial<InterviewQuestion> {
  return typeof value === "object" && value !== null;
}

export function normalizeInterviewScript(input: unknown): InterviewScript {
  if (Array.isArray(input)) {
    const items = input
      .filter(isQuestionLike)
      .map((question, index, source) => ({
        id: typeof question.id === "string" ? question.id : `q${index + 1}`,
        phase:
          question.phase === "warmup" || question.phase === "core" || question.phase === "closing"
            ? question.phase
            : getPhaseForIndex(index, source.length),
        text: typeof question.text === "string" ? question.text.trim() : "",
        followUp:
          question.followUp &&
          typeof question.followUp === "object" &&
          typeof question.followUp.text === "string" &&
          question.followUp.text.trim()
            ? { text: question.followUp.text.trim() }
            : null,
        evaluates: Array.isArray(question.evaluates)
          ? question.evaluates.filter((value): value is string => typeof value === "string")
          : [],
      }))
      .filter((question) => question.text.length > 0);

    return {
      items: items.length > 0 ? items : createDefaultInterviewScript().items,
      voiceAgent: {
        id: DEFAULT_VOICE_AGENT.id,
        name: DEFAULT_VOICE_AGENT.name,
      },
    };
  }

  if (typeof input === "object" && input !== null && "items" in input) {
    const record = input as { items?: unknown; voiceAgent?: { id?: string; name?: string } };
    const normalized = normalizeInterviewScript(record.items);
    const voiceAgent = getVoiceAgentById(record.voiceAgent?.id);

    return {
      items: normalized.items,
      voiceAgent: {
        id: voiceAgent.id,
        name: typeof record.voiceAgent?.name === "string" ? record.voiceAgent.name : voiceAgent.name,
      },
    };
  }

  return createDefaultInterviewScript();
}
