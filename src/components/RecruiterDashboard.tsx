"use client";

import { CopyIcon, ExternalLinkIcon, Loader2, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type RecruiterInterview = {
  id: string;
  title: string;
  token: string;
  status: string;
  created_at: string;
  sessionCount: number;
};

type RecruiterDashboardProps = {
  recruiterEmail: string;
  interviews: RecruiterInterview[];
};

export function RecruiterDashboard({ recruiterEmail, interviews }: RecruiterDashboardProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function handleCreateInterview() {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError("Interview title is required.");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/interviews/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: trimmedTitle }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to create interview.");
      }

      setTitle("");
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to create interview.");
    } finally {
      setIsCreating(false);
    }
  }

  async function copyInterviewLink(token: string, id: string) {
    const link = `${window.location.origin}/interview/${token}`;
    await navigator.clipboard.writeText(link);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1500);
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-slate-200 bg-white px-8 py-10 shadow-xl shadow-slate-200/60">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-sky-700">
              Recruiter Overview
            </p>
            <div className="space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
                Welcome back, {recruiterEmail}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-600">
                Create a tutor interview, copy the candidate link, and review submitted sessions from
                one place.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/40">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-sky-700">
            Create Interview
          </p>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
            Launch a new TutorScreen AI link
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Every interview uses the Cuemath question bank automatically and generates a unique share
            token for candidates.
          </p>

          <div className="mt-8 space-y-4">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Example: Grade 3-5 Math Tutor Screening"
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm shadow-sm outline-none transition focus:border-slate-300"
            />

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => void handleCreateInterview()}
              disabled={isCreating}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusIcon className="h-4 w-4" />}
              {isCreating ? "Creating..." : "Create interview"}
            </button>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/40">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-sky-700">
                Active Interviews
              </p>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
                Share candidate links
              </h2>
            </div>
            <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm text-slate-600">
              {interviews.length} total
            </div>
          </div>

          <div className="mt-8 space-y-4">
            {interviews.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-sm leading-7 text-slate-500">
                No interviews yet. Create your first interview to generate a public candidate link.
              </div>
            ) : (
              interviews.map((interview) => {
                const link = `/interview/${interview.token}`;
                return (
                  <div
                    key={interview.id}
                    className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <p className="text-lg font-semibold tracking-tight text-slate-950">
                          {interview.title}
                        </p>
                        <p className="text-sm text-slate-500">
                          {new Date(interview.created_at).toLocaleString()} · {interview.sessionCount} session
                          {interview.sessionCount === 1 ? "" : "s"}
                        </p>
                        <p className="rounded-full bg-white px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                          {interview.status}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => void copyInterviewLink(interview.token, interview.id)}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                        >
                          <CopyIcon className="h-4 w-4" />
                          {copiedId === interview.id ? "Copied" : "Copy link"}
                        </button>
                        <a
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
                        >
                          <ExternalLinkIcon className="h-4 w-4" />
                          Open candidate view
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
