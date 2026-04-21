import Link from "next/link";
import { Fraunces } from "next/font/google";
import { notFound, redirect } from "next/navigation";

import { ScoreCard } from "@/components/ScoreCard";
import { createClient } from "@/lib/server";
import type { TranscriptEntry } from "@/types";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700"],
});

export default async function SessionResultsPage({
  params,
}: {
  params: Promise<{ interviewId: string; sessionId: string }>;
}) {
  const { interviewId, sessionId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/auth/login");
  }

  const { data: interview, error: interviewError } = await supabase
    .from("interviews")
    .select("id, title")
    .eq("id", interviewId)
    .eq("recruiter_id", user.id)
    .single();

  if (interviewError || !interview) {
    notFound();
  }

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("interview_id", interviewId)
    .single();

  if (sessionError || !session) {
    notFound();
  }

  const transcript = (session.transcript ?? []) as TranscriptEntry[];

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Link
          href={`/dashboard/${interviewId}`}
          className="text-sm font-medium text-sky-700 transition hover:text-sky-900"
        >
          ← Back to interview results
        </Link>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/40">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-sky-700">Session Review</p>
          <h1 className={`${fraunces.className} mt-4 text-4xl font-semibold tracking-tight text-slate-950`}>
            {session.candidate_name || "Candidate"} · {interview.title}
          </h1>
        </div>
      </div>

      {session.status !== "analyzed" ? (
        <div className="flex items-center gap-4 rounded-[1.75rem] border border-slate-200 bg-white px-6 py-5 shadow-lg shadow-slate-200/30">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-950" />
          <p className="text-sm font-medium text-slate-700">Analysis pending...</p>
        </div>
      ) : session.scorecard ? (
        <ScoreCard scorecard={session.scorecard} candidateName={session.candidate_name} />
      ) : null}


      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/40">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-8 mb-10">
          <div className="space-y-1">
            <h2 className={`${fraunces.className} text-3xl font-semibold tracking-tight text-slate-950`}>
              Conversation Log
            </h2>
            <p className="text-sm text-slate-500 font-medium">Review the full transcript and listen to the original recording below.</p>
          </div>
          
          {session.audio_url && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-4 min-w-[320px]">
              <div className="bg-emerald-100 p-2 rounded-full text-emerald-700">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                </svg>
              </div>
              <audio 
                controls 
                className="h-8 max-w-[240px]"
                src={session.audio_url}
              >
                Your browser does not support audio.
              </audio>
            </div>
          )}
        </div>

        <div className="space-y-8">
          {transcript.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-slate-400 font-medium">Transcript not available yet or session was interrupted.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-8 max-w-4xl mx-auto">
              {transcript.map((entry, index) => {
                const isAi = entry.role === "ai";
                return (
                  <div key={`${entry.timestamp}-${index}`} className={`flex ${isAi ? "justify-start" : "justify-end"}`}>
                    <div className={`flex flex-col ${isAi ? "items-start" : "items-end"} max-w-[85%]`}>
                       <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                             {isAi ? "Cuemath AI" : session.candidate_name || "Candidate"}
                          </span>
                       </div>
                      <div
                        className={
                          isAi
                            ? "rounded-[1.5rem] rounded-tl-none bg-slate-100 px-6 py-4 text-slate-800 shadow-sm"
                            : "rounded-[1.5rem] rounded-tr-none bg-emerald-600 px-6 py-4 text-white shadow-emerald-200 shadow-lg"
                        }
                      >
                        <p className="text-base leading-relaxed">{entry.content}</p>
                      </div>
                      <p className="mt-2 text-[10px] text-slate-400 font-medium font-mono">
                        {entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
