import { Fraunces } from "next/font/google";

import { InterviewShell } from "@/components/InterviewShell";
import { createPublicClient } from "@/lib/public-supabase";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700"],
});

export default async function CandidateInterviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createPublicClient();

  const { data: interview, error } = await supabase
    .from("interviews")
    .select("id, title, token, status")
    .eq("token", token)
    .single();

  if (error || !interview || interview.status !== "active") {
    return (
      <div
        className="flex min-h-screen items-center justify-center px-6 py-12"
        style={{ background: "radial-gradient(ellipse at center, #EEF7F2 0%, #FAFAF7 70%)" }}
      >
        <div className="w-full max-w-xl rounded-[2rem] border border-white/70 bg-white/85 p-10 text-center shadow-2xl shadow-slate-200/60 backdrop-blur">
          <p className={`${fraunces.className} text-xl font-semibold text-[#2D5F3F]`}>Cuemath</p>
          <h1 className={`${fraunces.className} mt-5 text-4xl font-semibold tracking-tight text-slate-950`}>
            This interview link is invalid or expired.
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Please contact the hiring team if you believe this is a mistake.
          </p>
        </div>
      </div>
    );
  }

  return <InterviewShell interview={interview} />;
}
