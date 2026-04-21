import type { ScoreCard as ScoreCardType } from "@/types";

type ScoreCardProps = {
  scorecard: ScoreCardType;
  candidateName?: string | null;
};

const recommendationStyles: Record<ScoreCardType["recommendation"], string> = {
  strong_yes: "bg-emerald-100 text-emerald-800",
  yes: "bg-sky-100 text-sky-800",
  no: "bg-amber-100 text-amber-800",
  strong_no: "bg-rose-100 text-rose-800",
};

export function ScoreCard({ scorecard, candidateName }: ScoreCardProps) {
  const entries = Object.entries(scorecard.dimensions) as Array<
    [keyof ScoreCardType["dimensions"], ScoreCardType["dimensions"][keyof ScoreCardType["dimensions"]]]
  >;

  const isFailed = scorecard.summary.toLowerCase().includes("failed");

  return (
    <div className="space-y-6">
      {isFailed && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-sm">
          <div className="flex items-center gap-3 font-bold mb-2 uppercase tracking-widest text-xs">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-200 text-amber-900 font-sans">!</span>
            AI Analysis Failed
          </div>
          <p className="text-sm leading-relaxed">
            We couldn't generate a detailed AI evaluation for this session (likely due to a temporary API hiccup or a very short transcript). The scores below are <strong>default placeholders</strong> and do not reflect the actual performance. Please review the transcript manually.
          </p>
        </div>
      )}

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/40">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-sky-700">Scorecard</p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              {candidateName ? `${candidateName}'s evaluation` : "Candidate evaluation"}
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-600">{scorecard.summary}</p>
          </div>

          <div className="space-y-3 lg:text-right">
            <p className="text-sm text-slate-500">Overall score</p>
            <p className="text-5xl font-semibold tracking-tight text-slate-950">
              {scorecard.overall_score}
            </p>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] ${recommendationStyles[scorecard.recommendation]}`}
            >
              {scorecard.recommendation.replace("_", " ")}
            </span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {entries.map(([dimension, details]) => (
          <div
            key={dimension}
            className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-md shadow-slate-200/30"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.16em] text-sky-700">
                  {dimension}
                </p>
                <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
                  {details.score}
                  <span className="text-base text-slate-400">/10</span>
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600">{details.reasoning}</p>
            <blockquote className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm italic text-slate-500">
              “{details.quote || "No direct quote captured."}”
            </blockquote>
          </div>
        ))}
      </section>
    </div>
  );
}
