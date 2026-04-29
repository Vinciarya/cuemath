"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, MicIcon, SpeakerIcon } from "lucide-react";
import { DM_Sans, Fraunces } from "next/font/google";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { InterviewQuestion, TranscriptEntry } from "@/types";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

type InterviewState = "idle" | "speaking" | "listening" | "processing" | "thank-you" | "completed";

type VoiceInterviewProps = {
  sessionId: string;
  candidateName: string;
  questions: InterviewQuestion[];
  voiceAgentId: string;
  voiceAgentName: string;
  onComplete: () => void;
};

type SpeechRecognitionAlternative = {
  transcript: string;
};

type SpeechRecognitionResult = {
  isFinal: boolean;
  0: SpeechRecognitionAlternative;
};

type SpeechRecognitionResultList = {
  length: number;
  [index: number]: SpeechRecognitionResult;
};

type SpeechRecognitionEvent = Event & {
  resultIndex: number;
  results: SpeechRecognitionResultList;
};

type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: ((event: Event) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  start: () => void;
  stop: () => void;
};

declare global {
  interface Window {
    webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
  }
}

const CLOSING_MESSAGE = "Thank you so much! That's all our questions. We'll be in touch soon.";

function nowIso() {
  return new Date().toISOString();
}

export function VoiceInterview({
  sessionId,
  candidateName,
  questions,
  voiceAgentId,
  voiceAgentName,
  onComplete,
}: VoiceInterviewProps) {
  const [interviewState, setInterviewState] = useState<InterviewState>("idle");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [, setAskedFollowUp] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  const transcriptRef = useRef<TranscriptEntry[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const isProcessingRef = useRef(false);
  const interviewStateRef = useRef<InterviewState>("idle");
  const currentQuestionIndexRef = useRef(0);
  const askedFollowUpRef = useRef(false);
  const hasStartedRef = useRef(false);
  const handledCurrentSpeechRef = useRef(false);
  const isMountedRef = useRef(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const safeQuestions = useMemo(() => questions.filter((question) => question.text.trim().length > 0), [questions]);

  const completedDots = useMemo(() => {
    if (interviewState === "completed") {
      return safeQuestions.length;
    }

    return currentQuestionIndex;
  }, [currentQuestionIndex, interviewState, safeQuestions.length]);

  useEffect(() => {
    interviewStateRef.current = interviewState;
  }, [interviewState]);

  const appendTranscript = useCallback((entry: TranscriptEntry) => {
    const nextTranscript = [...transcriptRef.current, entry];
    transcriptRef.current = nextTranscript;
    setTranscript(nextTranscript);
    return nextTranscript;
  }, []);

  const stopRecognition = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // Ignore stop errors from inactive recognition sessions.
    }
  }, []);

  const speakFallback = useCallback((text: string) => {
    return new Promise<void>((resolve) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      // Try to find a good Indian English or high-quality English voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.lang.includes('en-IN') || v.name.includes('Google US English'));
      if (preferredVoice) utterance.voice = preferredVoice;
      
      utterance.lang = "en-IN";
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  const playAudio = useCallback(
    (text: string) => {
      return new Promise<void>(async (resolve, reject) => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }

        try {
          const response = await fetch("/api/voice", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text,
              voiceId: voiceAgentId,
            }),
          });

          if (!response.ok) {
            throw new Error("Voice generation failed.");
          }

          const blob = await response.blob();
          const objectUrl = URL.createObjectURL(blob);
          const audio = new Audio(objectUrl);
          audioRef.current = audio;

          let settled = false;

          const cleanup = () => {
            URL.revokeObjectURL(objectUrl);
          };

          const resolveOnce = () => {
            if (settled) {
              return;
            }

            settled = true;
            cleanup();
            resolve();
          };

          const fallbackToSpeech = () => {
            void speakFallback(text)
              .then(() => {
                if (settled) {
                  return;
                }

                settled = true;
                cleanup();
                resolve();
              })
              .catch(() => {
                if (settled) {
                  return;
                }

                settled = true;
                cleanup();
                reject(new Error("Audio playback failed."));
              });
          };

          audio.onended = resolveOnce;
          audio.onerror = fallbackToSpeech;

          void audio.play().catch(() => fallbackToSpeech());
        } catch {
          void speakFallback(text)
            .then(resolve)
            .catch(() => reject(new Error("Audio playback failed.")));
        }
      });
    },
    [speakFallback, voiceAgentId]
  );

  const playClosingMessage = useCallback(async () => {
    await playAudio(CLOSING_MESSAGE);
  }, [playAudio]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setWarning("Speech recognition is only supported in Chrome on this device.");
      return;
    }

    handledCurrentSpeechRef.current = false;
    setInterimTranscript("");
    setInterviewState("listening");

    try {
      recognitionRef.current.start();
    } catch {
      // Recognition throws if started while already active.
    }
  }, []);

  const speakPrompt = useCallback(
    async (text: string) => {
      stopRecognition();
      setInterviewState("speaking");
      appendTranscript({
        role: "ai",
        content: text,
        timestamp: nowIso(),
      });

      await playAudio(text);

      if (isMountedRef.current) {
        startListening();
      }
    },
    [appendTranscript, playAudio, startListening, stopRecognition]
  );

  const handleResponse = useCallback(
    async (candidateText: string, isFinalForceEnd = false) => {
      const trimmedText = candidateText.trim();

      if (!isFinalForceEnd && (!trimmedText || isProcessingRef.current)) {
        return;
      }

      isProcessingRef.current = true;
      setIsProcessing(true);
      setInterimTranscript("");

      const updatedTranscript = appendTranscript({
        role: "candidate",
        content: trimmedText,
        timestamp: nowIso(),
      });

      const activeQuestion = safeQuestions[currentQuestionIndexRef.current];
      const wordCount = trimmedText.split(/\s+/).filter(Boolean).length;

      try {
        if (activeQuestion?.followUp && !askedFollowUpRef.current && wordCount < 25) {
          askedFollowUpRef.current = true;
          setAskedFollowUp(true);
          await speakPrompt(activeQuestion.followUp.text);
          return;
        }

        if (!isFinalForceEnd && currentQuestionIndexRef.current < safeQuestions.length - 1) {
          const nextIndex = currentQuestionIndexRef.current + 1;
          currentQuestionIndexRef.current = nextIndex;
          askedFollowUpRef.current = false;

          setCurrentQuestionIndex(nextIndex);
          setAskedFollowUp(false);

          const nextQuestion = safeQuestions[nextIndex];
          await speakPrompt(nextQuestion.text);
          return;
        }

        setInterviewState("thank-you");

        const finalTranscript = appendTranscript({
          role: "ai",
          content: CLOSING_MESSAGE,
          timestamp: nowIso(),
        });

        await playClosingMessage();

        const performFinalTasks = async () => {
          // 1. Ensure recorder is fully stopped
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
            await new Promise((resolve) => setTimeout(resolve, 1500));
          } else {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }

          const recorderMimeType = mediaRecorderRef.current?.mimeType || "audio/webm";
          const recordingBlob = new Blob(audioChunksRef.current, { type: recorderMimeType });

          setInterviewState("processing"); // Show 'Wrapping up' UI

          // 2. Await analysis so it's ready when we redirect
          try {
            await fetch("/api/analyze", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ sessionId, transcript: finalTranscript }),
            });
          } catch (error) {
            console.error("Analysis error:", error);
          }

          // 3. Background upload of audio (less critical, can be async)
          if (recordingBlob.size > 100) {
            const formData = new FormData();
            const extension = recorderMimeType.includes("mp4") ? "mp4" : "webm";
            formData.append("audio", recordingBlob, `${sessionId}.${extension}`);
            formData.append("sessionId", sessionId);

            fetch("/api/upload-audio", {
              method: "POST",
              body: formData,
            }).catch((error) => console.error("Audio upload error:", error));
          }

          if (isMountedRef.current) {
            setInterviewState("completed");
            onComplete();
          }
        };

        void performFinalTasks();
        return;
      } catch (error) {
        setInterviewState("idle");
        setWarning(
          error instanceof Error ? error.message : "Something went wrong while completing the interview."
        );
      } finally {
        isProcessingRef.current = false;
        setIsProcessing(false);
      }
    },
    [appendTranscript, onComplete, playClosingMessage, safeQuestions, sessionId, speakPrompt]
  );

  const startInterview = useCallback(async () => {
    if (hasStartedRef.current || safeQuestions.length === 0) {
      return;
    }

    hasStartedRef.current = true;
    currentQuestionIndexRef.current = 0;
    askedFollowUpRef.current = false;

    setCurrentQuestionIndex(0);
    setAskedFollowUp(false);
    setWarning(null);

    try {
      const firstQuestion = safeQuestions[0];
      await speakPrompt(firstQuestion.text);
    } catch {
      setInterviewState("idle");
      setWarning("Unable to start audio playback. Please check your device audio permissions.");
    }
  }, [safeQuestions, speakPrompt]);

  const handleDoneTalking = useCallback(() => {
    const manualTranscript = interimTranscript.trim();
    handledCurrentSpeechRef.current = true;
    stopRecognition();
    void handleResponse(manualTranscript, false);
  }, [handleResponse, interimTranscript, stopRecognition]);

  const handleSkip = useCallback(() => {
    handledCurrentSpeechRef.current = true;
    stopRecognition();
    // Pass empty string and force the next question
    void handleResponse("", false);
  }, [handleResponse, stopRecognition]);

  const handleEndEarly = useCallback(() => {
    handledCurrentSpeechRef.current = true;
    stopRecognition();
    // Pass empty string and force end
    void handleResponse("", true);
  }, [handleResponse, stopRecognition]);

  const handleResponseRef = useRef(handleResponse);
  const startListeningRef = useRef(startListening);
  const handleDoneTalkingRef = useRef(handleDoneTalking);
  const startInterviewRef = useRef(startInterview);

  handleResponseRef.current = handleResponse;
  startListeningRef.current = startListening;
  handleDoneTalkingRef.current = handleDoneTalking;
  startInterviewRef.current = startInterview;

  useEffect(() => {
    isMountedRef.current = true;

    const RecognitionConstructor = window.webkitSpeechRecognition;

    if (!RecognitionConstructor) {
      setWarning("This interview requires Google Chrome because speech recognition is not available.");
      return () => {
        isMountedRef.current = false;
      };
    }

    const recognition = new RecognitionConstructor();
    recognition.lang = "en-IN";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let nextInterim = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcriptChunk = result[0]?.transcript ?? "";

        if (result.isFinal) {
          const finalValue = transcriptChunk.trim();
          if (finalValue && !handledCurrentSpeechRef.current) {
            handledCurrentSpeechRef.current = true;
            void handleResponseRef.current(finalValue);
          }
        } else {
          nextInterim += transcriptChunk;
        }
      }

      // Only update interim text if it actually changed to reduce re-renders
      if (nextInterim.trim() !== interimTranscript) {
        setInterimTranscript(nextInterim.trim());
      }
    };

    recognition.onend = () => {
      if (
        !handledCurrentSpeechRef.current &&
        !isProcessingRef.current &&
        interviewStateRef.current === "listening"
      ) {
        setInterviewState("listening");
      }
    };

    recognition.onerror = (event: any) => {
      if (!isProcessingRef.current) {
        if (event.error === "no-speech" || event.error === "aborted") {
          if (interviewStateRef.current === "listening") {
            setTimeout(() => {
              if (interviewStateRef.current === "listening") {
                startListeningRef.current();
              }
            }, 500);
          }
        } else if (event.error === "network") {
          setWarning("Network connection issues detected. Please check your internet and restart below.");
        } else {
          console.error("Speech recognition error:", event.error);
          setWarning(`Microphone error (${event.error}). Try clicking "Done talking" or restart below.`);
        }
      }
    };

    recognitionRef.current = recognition;

    const startRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Find best supported mimeType
        const mimeTypes = ["audio/webm", "audio/webm;codecs=opus", "audio/mp4", "audio/aac"];
        const supportedType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || "";
        
        const recorder = new MediaRecorder(stream, supportedType ? { mimeType: supportedType } : {});

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        recorder.onstop = () => {
          console.log("Recording stopped, total chunks:", audioChunksRef.current.length);
        };

        recorder.start(1000);
        mediaRecorderRef.current = recorder;
      } catch (error) {
        console.error("Recording setup failed:", error);
      }
    };

    void startRecording();
    void startInterviewRef.current();

    return () => {
      isMountedRef.current = false;
      try {
        recognitionRef.current?.stop();
      } catch {}

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []); // Only run once on mount

  return (
    <div className={`${dmSans.className} flex min-h-screen flex-col bg-white text-slate-900`}>
      <header className="w-full space-y-2 border-b border-slate-100 py-12 text-center">
        <h1 className={`${fraunces.className} text-2xl font-bold tracking-tight text-slate-900`}>
          CueMath - {candidateName} Interview
        </h1>
        <div className="flex items-center justify-center gap-2 text-sm font-medium uppercase tracking-widest text-slate-400">
          <span>{voiceAgentName} is guiding this interview</span>
        </div>
      </header>

      <main className="relative grid h-full flex-1 md:grid-cols-2">
        <div className="absolute bottom-0 left-1/2 top-0 hidden w-[1px] bg-slate-100 md:block" />

        <div className="flex h-[500px] flex-col items-center justify-between p-12 text-center md:h-auto">
          <div className="max-w-md space-y-6">
            <AnimatePresence mode="wait">
              <motion.p
                key={transcript.filter((entry) => entry.role === "ai").pop()?.content}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`${fraunces.className} text-3xl font-medium leading-tight text-slate-900 md:text-4xl`}
              >
                {interviewState === "speaking" || interviewState === "listening"
                  ? transcript.filter((entry) => entry.role === "ai").pop()?.content
                  : "Ready to start?"}
              </motion.p>
            </AnimatePresence>
          </div>

          <div className="space-y-4 pt-12">
            <div
              className={`flex h-32 w-32 items-center justify-center rounded-full border-2 bg-slate-50 transition-all ${
                interviewState === "speaking" ? "scale-110 border-emerald-500" : "border-slate-100"
              }`}
            >
              <SpeakerIcon
                className={`h-12 w-12 ${
                  interviewState === "speaking" ? "text-emerald-500" : "text-slate-300"
                }`}
              />
            </div>
            <p className="text-sm font-bold uppercase tracking-widest text-slate-400">
              Interviewer
            </p>
          </div>
        </div>

        <div className="flex h-[500px] flex-col items-center justify-between bg-slate-50/50 p-12 text-center md:h-auto md:bg-transparent">
          <div className="max-w-md space-y-6">
            {interimTranscript ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-2xl font-medium leading-relaxed text-slate-800 md:text-3xl"
              >
                {interimTranscript}
              </motion.p>
            ) : (
              <p className="text-xl font-medium italic text-slate-300 md:text-2xl">
                {interviewState === "listening"
                  ? "We&apos;re listening..."
                  : "Your turn to speak will appear here..."}
              </p>
            )}
          </div>

          <div className="space-y-4 pt-12">
            <div
              className={`flex h-32 w-32 items-center justify-center rounded-full border-2 bg-slate-950 transition-all ${
                interviewState === "listening"
                  ? "scale-110 border-emerald-500 shadow-2xl"
                  : "border-slate-800"
              }`}
            >
              <MicIcon
                className={`h-12 w-12 ${
                  interviewState === "listening" ? "text-emerald-500" : "text-white"
                }`}
              />
            </div>
            <p className="text-sm font-bold uppercase tracking-widest text-slate-400">You</p>
          </div>
        </div>

        <div className="absolute bottom-12 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-6">
          <AnimatePresence mode="wait">
            {interviewState === "thank-you" ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-lg space-y-6 rounded-[2.5rem] border border-slate-50 bg-white p-12 text-center shadow-[0_40px_100px_rgba(0,0,0,0.15)]"
              >
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className={`${fraunces.className} text-3xl font-bold text-slate-900`}>
                  All done, {candidateName}!
                </h2>
                <p className="text-lg leading-relaxed text-slate-500">
                  Thank you for sharing your thoughts with us. Your interview has been recorded and
                  our team will review it shortly.
                </p>
              </motion.div>
            ) : interviewState === "processing" ? (
              <div className="flex h-14 items-center gap-4 rounded-2xl border border-slate-100 bg-white px-8 shadow-2xl">
                <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                <span className="font-semibold text-slate-700">Wrapping up...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6">
                <AnimatePresence>
                  {warning && !warning.includes("ElevenLabs") && !warning.includes("Voice generation failed") ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-3 text-sm text-amber-800 shadow-xl"
                    >
                      <p>{warning}</p>
                      <button
                        onClick={() => {
                          setWarning(null);
                          startListeningRef.current();
                        }}
                        className="text-xs font-bold uppercase underline"
                      >
                        Restart
                      </button>
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-3">
                    {interimTranscript ? (
                      <button
                        onClick={handleDoneTalking}
                        disabled={isProcessing}
                        className="group flex h-16 items-center gap-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-10 shadow-lg transition-all hover:bg-emerald-100 hover:shadow-xl active:scale-95"
                      >
                        <span className={`${fraunces.className} text-lg font-bold text-emerald-900`}>
                          Done Talking
                        </span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-200/50 text-emerald-700">
                          →
                        </div>
                      </button>
                    ) : (
                      <button
                        onClick={handleSkip}
                        disabled={isProcessing}
                        className="group flex h-16 items-center gap-4 rounded-2xl border border-slate-100 bg-white px-10 shadow-lg transition-all hover:bg-slate-50 hover:shadow-xl active:scale-95"
                      >
                        <span className={`${fraunces.className} text-lg font-bold text-slate-900`}>
                          Skip Question
                        </span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                          →
                        </div>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={handleEndEarly}
                    disabled={isProcessing}
                    className="text-xs font-bold uppercase tracking-widest text-slate-400 transition hover:text-red-500"
                  >
                    End Interview Early
                  </button>
                </div>
              </div>
            )}
          </AnimatePresence>

          <div className="flex gap-2">
            {safeQuestions.map((question, index) => (
              <div
                key={question.id || index}
                className={`h-1.5 w-1.5 rounded-full ${index < completedDots ? "bg-slate-900" : "bg-slate-200"}`}
              />
            ))}
          </div>
        </div>
      </main>

      {interviewState === "listening" ? (
        <div className="pointer-events-none fixed inset-0 z-50 animate-pulse ring-[12px] ring-emerald-500/10" />
      ) : null}
    </div>
  );
}
