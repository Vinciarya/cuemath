import Link from "next/link";
import { Fraunces } from "next/font/google";
import { redirect } from "next/navigation";

import { CreateInterview } from "@/components/CreateInterview";
import { LogoutButton } from "@/components/logout-button";
import { createClient } from "@/lib/server";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700"],
});

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/auth/login");
  }

  const { data: interviews, error } = await supabase
    .from("interviews")
    .select("id, title, status, created_at, sessions(id, overall_score)")
    .eq("recruiter_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const rows =
    interviews?.map((interview) => {
      const sessions = Array.isArray(interview.sessions) ? interview.sessions : [];
      const scoredSessions = sessions.filter(
        (session) => typeof session.overall_score === "number"
      );
      const avgScore =
        scoredSessions.length > 0
          ? (
              scoredSessions.reduce((sum, session) => sum + (session.overall_score ?? 0), 0) /
              scoredSessions.length
            ).toFixed(1)
          : "-";

      return {
        id: interview.id,
        title: interview.title,
        sessionCount: sessions.length,
        avgScore,
        status: interview.status,
        createdAt: interview.created_at,
      };
    }) ?? [];

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-6 rounded-[2rem] border border-slate-200 bg-white px-8 py-8 shadow-lg shadow-slate-200/40 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-sky-700">
            Recruiter Dashboard
          </p>
          <h1 className={`${fraunces.className} text-4xl font-semibold tracking-tight text-slate-950`}>
            TutorScreen AI
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <CreateInterview appUrl={appUrl} />
          <LogoutButton />
        </div>
      </header>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/40">
        {rows.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
            No interviews yet. Create your first one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-3">
              <thead>
                <tr className="text-left text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                  <th className="pb-2">Title</th>
                  <th className="pb-2">Sessions</th>
                  <th className="pb-2">Avg Score</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Created</th>
                  <th className="pb-2 text-right">Results</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="rounded-2xl bg-slate-50 text-sm text-slate-700">
                    <td className="rounded-l-2xl px-4 py-4 font-medium text-slate-950">{row.title}</td>
                    <td className="px-4 py-4">{row.sessionCount}</td>
                    <td className="px-4 py-4">{row.avgScore}</td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">{new Date(row.createdAt).toLocaleDateString()}</td>
                    <td className="rounded-r-2xl px-4 py-4 text-right">
                      <Link
                        href={`/dashboard/${row.id}`}
                        className="text-sm font-semibold text-sky-700 transition hover:text-sky-900"
                      >
                        View Results
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
