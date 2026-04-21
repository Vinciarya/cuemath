"use client";

import { AnimatePresence, motion } from "framer-motion";
import { DM_Sans, Fraunces } from "next/font/google";
import { MicIcon, Volume2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { VoiceInterview } from "@/components/VoiceInterview";
import { normalizeInterviewScript } from "@/lib/questions";
import type { Interview } from "@/types";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

type InterviewShellProps = {
  interview: Pick<Interview, "id" | "title" | "token" | "questions">;
};

type Screen = 1 | 2 | 3;

export function InterviewShell({ interview }: InterviewShellProps) {
  const [screen, setScreen] = useState<Screen>(1);
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const script = useMemo(() => normalizeInterviewScript(interview.questions), [interview.questions]);

  const canStart = useMemo(() => {
    return candidateName.trim().length > 1 && /\S+@\S+\.\S+/.test(candidateEmail.trim());
  }, [candidateEmail, candidateName]);

  const handleStart = useCallback(async () => {
    if (!canStart) {
      setError("Please enter your full name and a valid email.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/sessions/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          interviewId: interview.id,
          candidateName: candidateName.trim(),
          candidateEmail: candidateEmail.trim(),
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        sessionId?: string;
      };

      if (!response.ok || !payload.sessionId) {
        throw new Error(payload.error ?? "Unable to start the interview.");
      }

      setSessionId(payload.sessionId);
      setScreen(2);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to start the interview.");
    } finally {
      setIsSubmitting(false);
    }
  }, [canStart, candidateEmail, candidateName, interview.id]);

  const handleComplete = useCallback(() => setScreen(3), []);

  return (
    <div
      className={`${dmSans.className} min-h-screen`}
      style={{ background: "radial-gradient(ellipse at center, #EEF7F2 0%, #FAFAF7 70%)" }}
    >
      <AnimatePresence mode="wait">
        {screen === 1 ? (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex min-h-screen items-center justify-center px-6 py-12"
          >
            <div className="w-full max-w-2xl rounded-[2rem] border border-white/70 bg-white/85 p-8 shadow-2xl shadow-slate-200/60 backdrop-blur">
              <p className={`${fraunces.className} text-xl font-semibold text-[#2D5F3F]`}>Cuemath</p>
              <h1 className={`${fraunces.className} mt-4 text-4xl font-semibold tracking-tight text-slate-950`}>
                You&apos;re invited to a voice interview
              </h1>
              <p className="mt-4 text-base leading-7 text-slate-600">
                This is a short AI-powered screening. Answer naturally. There are no trick
                questions.
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-500">{interview.title}</p>

              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-700">
                <Volume2 className="mt-0.5 h-5 w-5 shrink-0 text-[#2D5F3F]" />
                <div>
                  <p className="font-semibold text-slate-900">Interviewer voice</p>
                  <p>{script.voiceAgent.name}</p>
                </div>
              </div>

              <div className="mt-8 grid gap-5">
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-700">Full Name</span>
                  <input
                    value={candidateName}
                    onChange={(event) => setCandidateName(event.target.value)}
                    placeholder="Your full name"
                    className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm shadow-sm outline-none transition focus:border-slate-300"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-700">Email</span>
                  <input
                    value={candidateEmail}
                    onChange={(event) => setCandidateEmail(event.target.value)}
                    placeholder="you@example.com"
                    type="email"
                    className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm shadow-sm outline-none transition focus:border-slate-300"
                  />
                </label>
              </div>

              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-[#EEF7F2] px-4 py-4 text-sm leading-6 text-slate-700">
                <MicIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#2D5F3F]" />
                <p>This interview requires microphone access. Please use Chrome.</p>
              </div>

              {error ? (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => void handleStart()}
                disabled={isSubmitting}
                className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#2D5F3F] px-6 text-sm font-semibold text-white transition hover:bg-[#254F34] disabled:cursor-not-allowed disabled:bg-[#7FA08A]"
              >
                {isSubmitting ? "Starting..." : "Start Interview ->"}
              </button>
            </div>
          </motion.div>
        ) : null}

        {screen === 2 && sessionId ? (
          <motion.div
            key="interview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <VoiceInterview
              sessionId={sessionId}
              candidateName={candidateName.trim()}
              questions={script.items}
              voiceAgentId={script.voiceAgent.id}
              voiceAgentName={script.voiceAgent.name}
              onComplete={handleComplete}
            />
          </motion.div>
        ) : null}

        {screen === 3 ? (
          <motion.div
            key="thanks"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex min-h-screen items-center justify-center px-6 py-12"
          >
            <div className="w-full max-w-2xl rounded-[2rem] border border-white/70 bg-white/85 p-10 text-center shadow-2xl shadow-slate-200/60 backdrop-blur">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#EEF7F2]">
                <svg viewBox="0 0 52 52" className="h-16 w-16">
                  <circle
                    cx="26"
                    cy="26"
                    r="25"
                    fill="none"
                    stroke="#2D5F3F"
                    strokeWidth="2"
                    opacity="0.2"
                  />
                  <path
                    d="M14 27 L22 35 L38 18"
                    fill="none"
                    stroke="#2D5F3F"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      strokeDasharray: 40,
                      strokeDashoffset: 40,
                      animation: "draw-check 0.7s ease forwards",
                    }}
                  />
                </svg>
              </div>

              <h1 className={`${fraunces.className} mt-8 text-4xl font-semibold tracking-tight text-slate-950`}>
                Thank you, {candidateName.trim()}!
              </h1>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Your responses have been recorded. The hiring team will review your interview and be
                in touch.
              </p>
              <p className={`${fraunces.className} mt-10 text-lg font-semibold text-[#2D5F3F]`}>
                Cuemath
              </p>

              <style jsx>{`
                @keyframes draw-check {
                  to {
                    stroke-dashoffset: 0;
                  }
                }
              `}</style>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
