"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type CreatedInterview = {
  id: string;
  token: string;
  title: string;
};

type CreateInterviewProps = {
  appUrl: string;
};

export function CreateInterview({ appUrl }: CreateInterviewProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdInterview, setCreatedInterview] = useState<CreatedInterview | null>(null);
  const [copied, setCopied] = useState(false);

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

  async function handleSubmit() {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError("Role title is required.");
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
        body: JSON.stringify({ title: trimmedTitle }),
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
    setCopied(false);
    setCreatedInterview(null);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-8">
          <div className="w-full max-w-xl rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/15">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.16em] text-sky-700">
                  Create Interview
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                  Launch a new screening link
                </h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close create interview dialog"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">Role Title</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. Math Tutor Grade 4-6"
                  className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm shadow-sm outline-none transition focus:border-slate-300"
                />
              </label>

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              ) : null}

              {createdInterview ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
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
            </div>

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
