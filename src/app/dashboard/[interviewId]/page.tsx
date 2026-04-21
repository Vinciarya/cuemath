import Link from "next/link";
import { Fraunces } from "next/font/google";
import { notFound, redirect } from "next/navigation";

import { ShareableLink } from "@/components/ShareableLink";
import { normalizeInterviewScript } from "@/lib/questions";
import { createClient } from "@/lib/server";
import { getBaseUrl } from "@/lib/url";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700"],
});

function recommendationBadge(recommendation: string | null | undefined) {
  switch (recommendation) {
    case "strong_yes":
      return "bg-emerald-100 text-emerald-800";
    case "yes":
      return "bg-sky-100 text-sky-800";
    case "no":
      return "bg-amber-100 text-amber-800";
    case "strong_no":
      return "bg-rose-100 text-rose-800";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export default async function InterviewResultsPage({
  params,
}: {
  params: Promise<{ interviewId: string }>;
}) {
  const { interviewId } = await params;
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
    .select("id, title, token, status, created_at, questions")
    .eq("id", interviewId)
    .eq("recruiter_id", user.id)
    .single();

  if (interviewError || !interview) {
    notFound();
  }

  const script = normalizeInterviewScript(interview.questions);

  const { data: sessions, error: sessionsError } = await supabase
    .from("sessions")
    .select("*")
    .eq("interview_id", interviewId)
    .order("started_at", { ascending: false });

  if (sessionsError) {
    throw new Error(sessionsError.message);
  }

  const appUrl = getBaseUrl();
  const shareableUrl = `${appUrl.replace(/\/$/, "")}/interview/${interview.token}`;

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Link href="/dashboard" className="text-sm font-medium text-sky-700 transition hover:text-sky-900">
          ← Back to dashboard
        </Link>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/40">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-800">Interview Overview</p>
          <h1 className={`${fraunces.className} mt-4 text-4xl font-semibold tracking-tight text-slate-950`}>
            {interview.title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Voice agent: <span className="font-semibold text-slate-700">{script.voiceAgent.name}</span>
          </p>

          <ShareableLink url={shareableUrl} />
        </div>
      </div>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/40">
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-left text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                <th className="pb-2">Candidate Name</th>
                <th className="pb-2">Email</th>
                <th className="pb-2">Score</th>
                <th className="pb-2">Recommendation</th>
                <th className="pb-2">Date</th>
                <th className="pb-2">Duration</th>
                <th className="pb-2 text-right">View</th>
              </tr>
            </thead>
            <tbody>
              {(sessions ?? []).map((session) => (
                <tr key={session.id} className="bg-slate-50 text-sm text-slate-700">
                  <td className="rounded-l-2xl px-4 py-4 font-medium text-slate-950">
                    {session.candidate_name || "Unknown"}
                  </td>
                  <td className="px-4 py-4">{session.candidate_email || "-"}</td>
                  <td className="px-4 py-4">{session.overall_score ?? "-"}</td>
                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] ${recommendationBadge(session.recommendation)}`}
                    >
                      {(session.recommendation ?? "pending").replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    {session.started_at ? new Date(session.started_at).toLocaleString() : "-"}
                  </td>
                  <td className="px-4 py-4">
                    {typeof session.duration_seconds === "number"
                      ? `${Math.round(session.duration_seconds / 60)} min`
                      : "-"}
                  </td>
                  <td className="rounded-r-2xl px-4 py-4 text-right">
                    <Link
                      href={`/dashboard/${interview.id}/${session.id}`}
                      className="text-sm font-semibold text-sky-700 transition hover:text-sky-900"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
