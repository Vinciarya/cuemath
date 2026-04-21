export interface InterviewQuestion {
  id: "q1" | "q2" | "q3" | "q4" | "q5";
  phase: "warmup" | "core" | "closing";
  text: string;
  audioSrc: string;
  followUp: {
    text: string;
    audioSrc: string;
  } | null;
  evaluates: string[];
}

export const CUEMATH_QUESTIONS: InterviewQuestion[] = [
  {
    id: "q1",
    phase: "warmup",
    text: "Hi! Welcome to Cuemath's tutor screening. I'm your AI interviewer today. To start, could you tell me a little about yourself and why you're interested in tutoring with Cuemath?",
    audioSrc: "/audio/q1.mp3",
    followUp: {
      text: "What age groups have you worked with before, if any?",
      audioSrc: "/audio/q1-followup.mp3",
    },
    evaluates: ["warmth", "fluency"],
  },
  {
    id: "q2",
    phase: "core",
    text: "Here's a scenario: a 9-year-old student looks confused and says they don't understand fractions at all. How would you explain what a fraction is to them?",
    audioSrc: "/audio/q2.mp3",
    followUp: {
      text: "Can you give me a real-world example you'd use?",
      audioSrc: "/audio/q2-followup.mp3",
    },
    evaluates: ["simplicity", "clarity", "patience"],
  },
  {
    id: "q3",
    phase: "core",
    text: "Imagine a student has been staring at a problem for 5 minutes and is getting frustrated. They say, I'm just bad at math. What do you do?",
    audioSrc: "/audio/q3.mp3",
    followUp: {
      text: "How do you keep them motivated without just giving them the answer?",
      audioSrc: "/audio/q3-followup.mp3",
    },
    evaluates: ["patience", "warmth"],
  },
  {
    id: "q4",
    phase: "core",
    text: "How would you explain the concept of multiplication to a child who only understands addition so far?",
    audioSrc: "/audio/q4.mp3",
    followUp: null,
    evaluates: ["simplicity", "clarity"],
  },
  {
    id: "q5",
    phase: "closing",
    text: "Last question — what do you think makes a truly great math tutor? Not just a good one, but someone a student will remember years later.",
    audioSrc: "/audio/q5.mp3",
    followUp: null,
    evaluates: ["warmth", "clarity"],
  },
];
