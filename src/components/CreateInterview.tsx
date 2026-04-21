"use client";

import { Loader2, PlayCircle, Volume2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { createDefaultInterviewScript } from "@/lib/questions";
import { VOICE_AGENTS } from "@/lib/voice-agents";
import type { InterviewQuestion } from "@/types";

type CreatedInterview = {
  id: string;
  token: string;
  title: string;
};

type CreateInterviewProps = {
  appUrl: string;
};

const DEFAULT_SCRIPT = createDefaultInterviewScript();

function cloneQuestions(questions: InterviewQuestion[]) {
  return questions.map((question) => ({
    ...question,
    followUp: question.followUp ? { ...question.followUp } : null,
    evaluates: [...question.evaluates],
  }));
}

export function CreateInterview({ appUrl }: CreateInterviewProps) {
  const router = useRouter();
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [voiceAgentId, setVoiceAgentId] = useState(DEFAULT_SCRIPT.voiceAgent.id);
  const [questions, setQuestions] = useState<InterviewQuestion[]>(() =>
    cloneQuestions(DEFAULT_SCRIPT.items)
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdInterview, setCreatedInterview] = useState<CreatedInterview | null>(null);
  const [copied, setCopied] = useState(false);
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const [previewNotice, setPreviewNotice] = useState<string | null>(null);

  const shareableLink = useMemo(() => {
    if (!createdInterview) {
      return "";
    }

    return `${appUrl.replace(/\/$/, "")}/interview/${createdInterview.token}`;
  }, [appUrl, createdInterview]);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  useEffect(() => {
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current.src = "";
      }
    };
  }, []);

  function speakPreviewFallback(text: string) {
    return new Promise<void>((resolve, reject) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        reject(new Error("Browser speech synthesis is not available."));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-IN";
      utterance.onend = () => resolve();
      utterance.onerror = () => reject(new Error("Browser speech synthesis failed."));

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    });
  }

  function updateQuestion(index: number, nextText: string) {
    setQuestions((current) =>
      current.map((question, questionIndex) =>
        questionIndex === index ? { ...question, text: nextText } : question
      )
    );
  }

  function updateFollowUp(index: number, nextText: string) {
    setQuestions((current) =>
      current.map((question, questionIndex) => {
        if (questionIndex !== index) {
          return question;
        }

        return {
          ...question,
          followUp: nextText.trim() ? { text: nextText } : null,
        };
      })
    );
  }

  async function playVoicePreview(targetVoiceId: string) {
    const voiceAgent = VOICE_AGENTS.find((item) => item.id === targetVoiceId);

    if (!voiceAgent) {
      return;
    }

    setPreviewingVoiceId(targetVoiceId);
    setError(null);
    setPreviewNotice(null);

    try {
      const response = await fetch("/api/voice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: voiceAgent.previewText,
          voiceId: voiceAgent.id,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as {
          error?: string;
          fallbackToBrowserTts?: boolean;
        };

        if (payload.fallbackToBrowserTts) {
          await speakPreviewFallback(voiceAgent.previewText);
          setPreviewNotice("Using browser voice preview because ElevenLabs is unavailable.");
          return;
        }

        throw new Error(payload.error ?? "Unable to generate preview audio.");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      setPreviewNotice(null);

      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        URL.revokeObjectURL(previewAudioRef.current.src);
      }

      const audio = new Audio(objectUrl);
      previewAudioRef.current = audio;
      audio.onended = () => {
        URL.revokeObjectURL(objectUrl);
        setPreviewingVoiceId((current) => (current === targetVoiceId ? null : current));
      };
      audio.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        setPreviewingVoiceId((current) => (current === targetVoiceId ? null : current));
      };

      await audio.play();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to play voice preview.");
    } finally {
      setPreviewingVoiceId(null);
    }
  }

  async function handleSubmit() {
    const trimmedTitle = title.trim();
    const nextQuestions = questions
      .map((question) => ({
        ...question,
        text: question.text.trim(),
        followUp: question.followUp?.text?.trim() ? { text: question.followUp.text.trim() } : null,
      }))
      .filter((question) => question.text.length > 0);

    if (!trimmedTitle) {
      setError("Role title is required.");
      return;
    }

    if (nextQuestions.length === 0) {
      setError("Add at least one interview question.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/interviews/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: trimmedTitle,
          voiceAgentId,
          questions: nextQuestions,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        interview?: CreatedInterview;
      };

      if (!response.ok || !payload.interview) {
        throw new Error(payload.error ?? "Unable to create interview.");
      }

      setCreatedInterview(payload.interview);
      setTitle("");
      setQuestions(cloneQuestions(DEFAULT_SCRIPT.items));
      setVoiceAgentId(DEFAULT_SCRIPT.voiceAgent.id);
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to create interview.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCopy() {
    if (!shareableLink) {
      return;
    }

    await navigator.clipboard.writeText(shareableLink);
    setCopied(true);
  }

  function handleClose() {
    setIsOpen(false);
    setError(null);
    setIsSubmitting(false);
    setTitle("");
    setVoiceAgentId(DEFAULT_SCRIPT.voiceAgent.id);
    setQuestions(cloneQuestions(DEFAULT_SCRIPT.items));
    setCopied(false);
    setCreatedInterview(null);
    setPreviewingVoiceId(null);
    setPreviewNotice(null);

    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.src = "";
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        New Interview
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 px-4 py-8">
          <div className="mx-auto w-full max-w-5xl rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/15">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.16em] text-sky-700">
                  Create Interview
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                  Launch a custom screening link
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Set the interviewer voice, preview how it sounds, and customize the exact
                  questions candidates will hear.
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close create interview dialog"
              >
                X
              </button>
            </div>

            <div className="mt-6 grid gap-8 xl:grid-cols-[0.92fr_1.08fr]">
              <div className="space-y-6">
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-700">Role Title</span>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="e.g. Math Tutor Grade 4-6"
                    className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm shadow-sm outline-none transition focus:border-slate-300"
                  />
                </label>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Interviewer Voice</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Pick the AI interviewer candidates will hear during the voice screening.
                    </p>
                  </div>

                  <div className="grid gap-3">
                    {VOICE_AGENTS.map((voiceAgent) => {
                      const isSelected = voiceAgent.id === voiceAgentId;
                      const isPreviewing = previewingVoiceId === voiceAgent.id;

                      return (
                        <div
                          key={voiceAgent.id}
                          className={`rounded-2xl border p-4 transition ${
                            isSelected
                              ? "border-[#2D5F3F] bg-[#EEF7F2]"
                              : "border-slate-200 bg-slate-50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <p className="text-base font-semibold text-slate-950">{voiceAgent.name}</p>
                                {isSelected ? (
                                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2D5F3F]">
                                    Selected
                                  </span>
                                ) : null}
                              </div>
                              <p className="text-sm leading-6 text-slate-600">{voiceAgent.description}</p>
                            </div>

                            <button
                              type="button"
                              onClick={() => void playVoicePreview(voiceAgent.id)}
                              disabled={isPreviewing}
                              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isPreviewing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <PlayCircle className="h-4 w-4" />
                              )}
                              {isPreviewing ? "Playing..." : "Demo Voice"}
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => setVoiceAgentId(voiceAgent.id)}
                            className={`mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${
                              isSelected
                                ? "bg-[#2D5F3F] text-white"
                                : "bg-slate-950 text-white hover:bg-slate-800"
                            }`}
                          >
                            <Volume2 className="h-4 w-4" />
                            {isSelected ? "Active Voice" : "Use This Voice"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-slate-700">Interview Questions</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Edit the main questions and optional short follow-ups. Blank question cards will
                    not be included.
                  </p>
                </div>

                <div className="max-h-[560px] space-y-4 overflow-y-auto pr-1">
                  {questions.map((question, index) => (
                    <div key={question.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Question {index + 1}
                        </p>
                        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                          {question.phase}
                        </span>
                      </div>

                      <label className="mt-4 grid gap-2">
                        <span className="text-sm font-medium text-slate-700">Main prompt</span>
                        <textarea
                          value={question.text}
                          onChange={(event) => updateQuestion(index, event.target.value)}
                          rows={4}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 shadow-sm outline-none transition focus:border-slate-300"
                        />
                      </label>

                      <label className="mt-4 grid gap-2">
                        <span className="text-sm font-medium text-slate-700">Follow-up prompt</span>
                        <textarea
                          value={question.followUp?.text ?? ""}
                          onChange={(event) => updateFollowUp(index, event.target.value)}
                          placeholder="Optional follow-up question"
                          rows={2}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 shadow-sm outline-none transition focus:border-slate-300"
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {error ? (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            {previewNotice ? (
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {previewNotice}
              </div>
            ) : null}

            {createdInterview ? (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                <p className="text-sm font-medium text-emerald-800">Interview created successfully.</p>
                <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center">
                  <code className="flex-1 overflow-hidden rounded-xl bg-white px-4 py-3 text-xs text-slate-700">
                    {shareableLink}
                  </code>
                  <button
                    type="button"
                    onClick={() => void handleCopy()}
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    {copied ? "Copied!" : "Copy Link"}
                  </button>
                </div>
              </div>
            ) : null}

            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={isSubmitting}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isSubmitting ? "Creating..." : "Create Interview"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
