import { redirect } from 'next/navigation'
import { BarChart3Icon, Clock3Icon, SparklesIcon, Users2Icon } from 'lucide-react'

import { LogoutButton } from '@/components/logout-button'
import { createClient } from '@/lib/server'

export default async function ProtectedPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) {
    redirect('/auth/login')
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
                Welcome back, {data.claims.email}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-600">
                This workspace is ready for TutorScreen AI. You can keep the current auth flow and
                start layering interview creation, candidate sessions, and rubric scoring on top of
                it.
              </p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Active interview templates",
            value: "05",
            icon: SparklesIcon,
          },
          {
            label: "Candidates in review",
            value: "12",
            icon: Users2Icon,
          },
          {
            label: "Avg. completion time",
            value: "18m",
            icon: Clock3Icon,
          },
          {
            label: "Review consistency",
            value: "92%",
            icon: BarChart3Icon,
          },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/40"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{label}</p>
              <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-8 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/40">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-sky-700">
            Next setup steps
          </p>
          <div className="mt-6 space-y-4 text-sm leading-7 text-slate-600">
            <div className="rounded-2xl bg-slate-50 p-4">
              1. Connect recruiter creation to your `recruiters` table after successful sign-up.
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              2. Build the interview template composer using the new Cuemath question bank.
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              3. Surface transcript scoring with Gemini and final recommendation summaries.
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-8 text-white shadow-xl shadow-slate-300/40">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-sky-300">
            Candidate experience
          </p>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight">
            Keep the interview flow calm, guided, and measurable.
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            Audio prompts, follow-up sequencing, and rubric-based evaluation are already scoped in
            the codebase. This dashboard can now become the command center instead of a placeholder
            auth page.
          </p>
        </div>
      </section>
    </div>
  )
}
