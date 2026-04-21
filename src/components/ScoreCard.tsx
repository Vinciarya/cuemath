import type { ScoreCard as ScoreCardType } from "@/types";
import { CheckCircle2, AlertCircle, TrendingUp, Quote } from "lucide-react";

type ScoreCardProps = {
  scorecard: ScoreCardType;
  candidateName?: string | null;
};

const recommendationStyles: Record<ScoreCardType["recommendation"], { label: string, color: string, bg: string, border: string }> = {
  strong_yes: { label: "Strong Hire", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-100" },
  yes: { label: "Hire", color: "text-sky-700", bg: "bg-sky-50", border: "border-sky-100" },
  no: { label: "Do Not Hire", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-100" },
  strong_no: { label: "Strongly Rejected", color: "text-rose-700", bg: "bg-rose-50", border: "border-rose-100" },
};

export function ScoreCard({ scorecard, candidateName }: ScoreCardProps) {
  const entries = Object.entries(scorecard.dimensions) as Array<
    [keyof ScoreCardType["dimensions"], ScoreCardType["dimensions"][keyof ScoreCardType["dimensions"]]]
  >;

  const isFailed = scorecard.summary.toLowerCase().includes("failed") || 
                   scorecard.summary.toLowerCase().includes("error") || 
                   scorecard.overall_score <= 1;

  const recommendation = recommendationStyles[scorecard.recommendation] || recommendationStyles.no;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {isFailed && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50/50 p-6 text-amber-900 shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-3 font-bold mb-3 uppercase tracking-[0.2em] text-[10px]">
            <AlertCircle className="h-4 w-4" />
            Evaluation Incomplete
          </div>
          <p className="text-sm leading-relaxed font-medium">
            The AI evaluation could not be fully generated. This typically happens if the conversation was too brief or interrupted. 
            The scores below are <strong>initial estimates</strong> and should be verified against the conversation log.
          </p>
        </div>
      )}

      {/* Header Section */}
      <section className="rounded-[2.5rem] border border-slate-200 bg-white p-10 shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4 flex-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-sky-800">
              <TrendingUp className="h-3 w-3" />
              Evaluation Report
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
              {candidateName ? `${candidateName}` : "Candidate Evaluation"}
            </h1>
            <div className="max-w-2xl text-lg leading-relaxed text-slate-600 font-medium italic">
              &ldquo;{scorecard.summary}&rdquo;
            </div>
          </div>

          <div className="flex flex-col items-center lg:items-end gap-4 shrink-0">
            <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-slate-50 border-4 border-slate-100 shadow-inner">
               <div className="text-center">
                  <span className="text-4xl font-bold text-slate-900">{scorecard.overall_score}</span>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Score</p>
               </div>
            </div>
            <div className={`flex items-center gap-2 rounded-full ${recommendation.bg} ${recommendation.border} border px-6 py-2 text-xs font-bold uppercase tracking-[0.15em] ${recommendation.color}`}>
              <CheckCircle2 className="h-4 w-4" />
              {recommendation.label}
            </div>
          </div>
        </div>
      </section>

      {/* Dimensions Grid */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {entries.map(([dimension, details]) => (
          <div
            key={dimension}
            className="group rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-xl hover:shadow-slate-200/40 hover:-translate-y-1"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-700">
                {dimension}
              </h3>
              <div className="flex items-baseline gap-0.5">
                <span className="text-2xl font-bold text-slate-950">{details.score}</span>
                <span className="text-xs font-bold text-slate-400">/10</span>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-slate-100 rounded-full mb-6 overflow-hidden">
               <div 
                 className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out" 
                 style={{ width: `${details.score * 10}%` }} 
               />
            </div>

            <p className="text-sm leading-relaxed text-slate-600 mb-6 font-medium">
              {details.reasoning}
            </p>

            {details.quote && (
              <div className="relative rounded-2xl bg-slate-50 p-5 pt-8">
                <Quote className="absolute top-4 left-4 h-5 w-5 text-slate-200" />
                <p className="text-xs italic text-slate-500 leading-relaxed relative z-10">
                  {details.quote}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
