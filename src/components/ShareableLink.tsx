"use client";

import { useEffect, useState } from "react";

type ShareableLinkProps = {
  url: string;
};

export function ShareableLink({ url }: ShareableLinkProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
  }

  return (
    <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-center">
      <code className="flex-1 overflow-hidden rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
        {url}
      </code>
      <button
        type="button"
        onClick={() => void handleCopy()}
        className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        {copied ? "Copied!" : "Copy Link"}
      </button>
    </div>
  );
}
