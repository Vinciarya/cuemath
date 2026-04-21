"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, MicIcon, SpeakerIcon } from "lucide-react";
import { DM_Sans, Fraunces } from "next/font/google";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import { CUEMATH_QUESTIONS } from "@/lib/questions";
import type { TranscriptEntry } from "@/types";

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

const STATUS_COPY: Record<InterviewState, string> = {
  idle: "Preparing your interview...",
  speaking: "AI is speaking...",
  listening: "Your turn - speak now",
  processing: "Analyzing your responses...",
  "thank-you": "Interview complete",
  completed: "Interview complete",
};

const CLOSING_MESSAGE = "Thank you so much! That's all our questions. We'll be in touch soon.";

function nowIso() {
  return new Date().toISOString();
}

export function VoiceInterview({
  sessionId,
  candidateName,
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

  // Audio Recording Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const completedDots = useMemo(() => {
    if (interviewState === "completed") {
      return CUEMATH_QUESTIONS.length;
    }

    return currentQuestionIndex;
  }, [currentQuestionIndex, interviewState]);

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
      utterance.lang = "en-IN";
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  const playAudio = useCallback(
    (audioSrc: string, fallbackText: string) => {
      return new Promise<void>((resolve, reject) => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }

        const audio = new Audio(audioSrc);
        audioRef.current = audio;

        let settled = false;

        const resolveOnce = () => {
          if (settled) {
            return;
          }
          settled = true;
          resolve();
        };

        const rejectOnce = (error: Error) => {
          if (settled) {
            return;
          }
          settled = true;
          reject(error);
        };

        const fallbackToSpeech = () => {
          void speakFallback(fallbackText)
            .then(resolveOnce)
            .catch(() => rejectOnce(new Error(`Failed to play audio and speech fallback: ${audioSrc}`)));
        };

        audio.onended = () => resolveOnce();
        audio.onerror = () => fallbackToSpeech();

        void audio.play().catch(() => fallbackToSpeech());
      });
    },
    [speakFallback]
  );

  const playClosingMessage = useCallback(async () => {
    await playAudio("/audio/closing.wav", CLOSING_MESSAGE);
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
    async (text: string, audioSrc: string) => {
      stopRecognition();
      setInterviewState("speaking");
      appendTranscript({
        role: "ai",
        content: text,
        timestamp: nowIso(),
      });

      await playAudio(audioSrc, text);

      if (isMountedRef.current) {
        startListening();
      }
    },
    [appendTranscript, playAudio, startListening, stopRecognition]
  );

  const handleResponse = useCallback(
    async (candidateText: string, isFinalForceEnd = false) => {
      const trimmedText = candidateText.trim();

      // We allow empty text ONLY if it's a force-end signal
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

      const activeQuestion = CUEMATH_QUESTIONS[currentQuestionIndexRef.current];
      const wordCount = trimmedText.split(/\s+/).filter(Boolean).length;

      try {
        if (activeQuestion.followUp && !askedFollowUpRef.current && wordCount < 25) {
          askedFollowUpRef.current = true;
          setAskedFollowUp(true);
          await speakPrompt(activeQuestion.followUp.text, activeQuestion.followUp.audioSrc);
          return;
        }

        if (!isFinalForceEnd && currentQuestionIndexRef.current < CUEMATH_QUESTIONS.length - 1) {
          const nextIndex = currentQuestionIndexRef.current + 1;
          currentQuestionIndexRef.current = nextIndex;
          askedFollowUpRef.current = false;

          setCurrentQuestionIndex(nextIndex);
          setAskedFollowUp(false);

          const nextQuestion = CUEMATH_QUESTIONS[nextIndex];
          await speakPrompt(nextQuestion.text, nextQuestion.audioSrc);
          return;
        }

        // --- FINAL WRAP UP ---
        setInterviewState("thank-you");
        
        // Append Closing Message to transcript
        const finalTranscript = appendTranscript({
          role: "ai",
          content: CLOSING_MESSAGE,
          timestamp: nowIso(),
        });

        await playClosingMessage();
        
        // Stop recording
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
          mediaRecorderRef.current.stop();
        }

        // Fire and forget analysis & upload in background
        const performFinalTasks = async () => {
           // Small delay to ensure the last chunk is potentially captured
           await new Promise(r => setTimeout(r, 1000));
           
           const recordingBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
           
           // Background Analysis - Using the final transcript with closing msg
           fetch("/api/analyze", {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ sessionId, transcript: finalTranscript }),
           }).catch(e => console.error("BG analysis error", e));

           // Background Audio Upload
           if (recordingBlob.size > 0) {
             const formData = new FormData();
             formData.append("audio", recordingBlob, `${sessionId}.webm`);
             formData.append("sessionId", sessionId);

             fetch("/api/upload-audio", {
               method: "POST",
               body: formData,
             }).catch(e => console.error("Audio upload error", e));
           }
        };

        performFinalTasks();
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
    [appendTranscript, onComplete, playClosingMessage, sessionId, speakPrompt]
  );

  const startInterview = useCallback(async () => {
    if (hasStartedRef.current) {
      return;
    }

    hasStartedRef.current = true;
    currentQuestionIndexRef.current = 0;
    askedFollowUpRef.current = false;

    setCurrentQuestionIndex(0);
    setAskedFollowUp(false);
    setWarning(null);

    try {
      const firstQuestion = CUEMATH_QUESTIONS[0];
      await speakPrompt(firstQuestion.text, firstQuestion.audioSrc);
    } catch {
      setInterviewState("idle");
      setWarning("Unable to start audio playback. Please check your device audio permissions.");
    }
  }, [speakPrompt]);

  const handleDoneTalking = useCallback(() => {
    const manualTranscript = interimTranscript.trim();
    // If no transcript, we treat it as an explicit signal to END the entire interview
    const isForceEnd = !manualTranscript;

    handledCurrentSpeechRef.current = true;
    stopRecognition();
    void handleResponse(manualTranscript, isForceEnd);
  }, [handleResponse, interimTranscript, stopRecognition]);

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
      let finalTranscript = "";
      let nextInterim = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcriptChunk = result[0]?.transcript ?? "";

        if (result.isFinal) {
          finalTranscript += transcriptChunk;
        } else {
          nextInterim += transcriptChunk;
        }
      }

      setInterimTranscript(nextInterim.trim());

      if (finalTranscript.trim() && !handledCurrentSpeechRef.current) {
        handledCurrentSpeechRef.current = true;
        void handleResponse(finalTranscript.trim());
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
        if (event.error === 'no-speech' || event.error === 'aborted') {
           // These are common and usually just mean silence or a restart
           if (interviewStateRef.current === "listening") {
             setTimeout(() => {
               if (interviewStateRef.current === "listening") startListening();
             }, 500);
           }
        } else if (event.error === 'network') {
          setWarning('Network connection issues detected. Please check your internet and restart below.');
        } else {
          console.error("Speech recognition error:", event.error);
          setWarning(`Microphone error (${event.error}). Try clicking "Done talking" or restart below.`);
        }
      }
    };

    recognitionRef.current = recognition;

    // --- MediaRecorder Setup ---
    const startRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
        
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        recorder.start(1000); // 1s chunks
        mediaRecorderRef.current = recorder;
      } catch (err) {
        console.error("Recording setup failed:", err);
      }
    };

    void startRecording();
    void startInterview();

    return () => {
      isMountedRef.current = false;
      stopRecognition();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [handleResponse, startInterview, stopRecognition]);

  return (
    <div className={`${dmSans.className} min-h-screen bg-white text-slate-900 flex flex-col`}>
      {/* Top Header */}
      <header className="w-full py-12 text-center space-y-2 border-b border-slate-100">
        <h1 className={`${fraunces.className} text-2xl font-bold text-slate-900 tracking-tight`}>
          TutorScreen AI – {candidateName} Interview
        </h1>
        <div className="flex items-center justify-center gap-2 text-slate-400 text-sm font-medium uppercase tracking-widest">
           <span>Expected duration: 5 mins or less</span>
        </div>
      </header>

      {/* Main Split View */}
      <main className="flex-1 grid md:grid-cols-2 relative h-full">
        {/* Vertical Divider */}
        <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-slate-100 hidden md:block" />

        {/* Left: AI Interviewer */}
        <div className="flex flex-col items-center justify-between p-12 text-center h-[500px] md:h-auto">
          <div className="max-w-md space-y-6">
             <AnimatePresence mode="wait">
                <motion.p 
                  key={transcript.filter(t => t.role === "ai").pop()?.content}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`${fraunces.className} text-3xl md:text-4xl text-slate-900 leading-tight font-medium`}
                >
                  {interviewState === "speaking" || interviewState === "listening" 
                    ? transcript.filter(t => t.role === "ai").pop()?.content 
                    : "Ready to start?"}
                </motion.p>
             </AnimatePresence>
          </div>

          <div className="space-y-4 pt-12">
            <div className={`w-32 h-32 rounded-full bg-slate-50 border-2 flex items-center justify-center transition-all ${interviewState === 'speaking' ? 'border-emerald-500 scale-110' : 'border-slate-100'}`}>
              <SpeakerIcon className={`h-12 w-12 ${interviewState === 'speaking' ? 'text-emerald-500' : 'text-slate-300'}`} />
            </div>
            <p className="font-bold text-sm uppercase tracking-widest text-slate-400">Interviewer</p>
          </div>
        </div>

        {/* Right: Candidate (You) */}
        <div className="flex flex-col items-center justify-between p-12 text-center h-[500px] md:h-auto bg-slate-50/50 md:bg-transparent">
          <div className="max-w-md space-y-6">
            {interimTranscript ? (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-2xl md:text-3xl font-medium text-slate-800 leading-relaxed"
                >
                  {interimTranscript}
                </motion.p>
            ) : (
                <p className="text-xl md:text-2xl text-slate-300 italic font-medium">
                  {interviewState === "listening" ? "We're listening..." : "Your turn to speak will appear here..."}
                </p>
            )}
          </div>

          <div className="space-y-4 pt-12">
             <div className={`w-32 h-32 rounded-full bg-slate-950 border-2 flex items-center justify-center transition-all ${interviewState === 'listening' ? 'border-emerald-500 scale-110 shadow-2xl' : 'border-slate-800'}`}>
               <MicIcon className={`h-12 w-12 ${interviewState === 'listening' ? 'text-emerald-500' : 'text-white'}`} />
             </div>
             <p className="font-bold text-sm uppercase tracking-widest text-slate-400">You</p>
          </div>
        </div>

        {/* End Interview / Status Button (Bottom Center) */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-6">
           <AnimatePresence mode="wait">
            {interviewState === "thank-you" ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-12 rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.15)] text-center space-y-6 max-w-lg border border-slate-50"
              >
                <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className={`${fraunces.className} text-3xl font-bold text-slate-900`}>All done, {candidateName}!</h2>
                <p className="text-slate-500 leading-relaxed text-lg">
                  Thank you for sharing your thoughts with us. Your interview has been recorded and our team will review it shortly.
                </p>
              </motion.div>
            ) : interviewState === "processing" ? (
              <div className="bg-white px-8 h-14 rounded-2xl shadow-2xl flex items-center gap-4 border border-slate-100">
                 <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                 <span className="font-semibold text-slate-700">Wrapping up...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6">
                <AnimatePresence>
                  {warning && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="bg-amber-50 border border-amber-200 px-6 py-3 rounded-2xl text-sm text-amber-800 flex items-center gap-4 shadow-xl"
                    >
                      <p>{warning}</p>
                      <button onClick={() => { setWarning(null); startListening(); }} className="font-bold underline uppercase text-xs">Restart</button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  onClick={handleDoneTalking}
                  disabled={isProcessing}
                  className="group bg-white h-16 px-10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-all flex items-center gap-4 border border-slate-100 active:scale-95"
                >
                  <span className={`${fraunces.className} text-lg font-bold text-slate-900`}>
                    {interimTranscript ? 'Done Talking' : 'End Interview'}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-red-50 group-hover:text-red-500 transition-colors">
                    ✕
                  </div>
                </button>
              </div>
            )}
           </AnimatePresence>

           {/* Progress Dots */}
           <div className="flex gap-2">
              {CUEMATH_QUESTIONS.map((_, i) => (
                <div key={i} className={`h-1.5 w-1.5 rounded-full ${i < completedDots ? 'bg-slate-900' : 'bg-slate-200'}`} />
              ))}
           </div>
        </div>
      </main>

      {/* Decorative Overlay for Speaking State */}
      {interviewState === 'listening' && (
        <div className="fixed inset-0 pointer-events-none ring-[12px] ring-emerald-500/10 animate-pulse z-50" />
      )}
    </div>
  );
}
