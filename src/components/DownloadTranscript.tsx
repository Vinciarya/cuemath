"use client";

import { TranscriptEntry } from "@/types";

type DownloadTranscriptProps = {
  transcript: TranscriptEntry[];
  sessionId: string;
};

export function DownloadTranscript({ transcript, sessionId }: DownloadTranscriptProps) {
  const handleDownload = () => {
    const text = transcript.map(e => `${e.role.toUpperCase()}: ${e.content}`).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${sessionId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleDownload}
      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
    >
      <span>Download Transcript</span>
    </button>
  );
}
