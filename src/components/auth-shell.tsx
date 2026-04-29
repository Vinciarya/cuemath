import type { PropsWithChildren, ReactNode } from "react";

interface AuthShellProps extends PropsWithChildren {
  eyebrow: string;
  title: string;
  description: string;
  footer?: ReactNode;
}

export function AuthShell({
  children,
  eyebrow,
  title,
  description,
  footer,
}: AuthShellProps) {
  return (
    <div className="auth-shell">
      <div className="auth-grid">
        <section className="auth-panel">
          <div className="space-y-8">
            <span className="auth-panel-chip">{eyebrow}</span>
            <div className="space-y-4">
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-white">
                CueMath for modern tutor hiring.
              </h1>
              <p className="max-w-lg text-base leading-7 text-slate-300">
                Review candidates with structured interviews, consistent scoring, and a calmer
                workflow for the Cuemath team.
              </p>
            </div>
          </div>

          <div className="grid gap-4 text-sm text-slate-300 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-2xl font-semibold text-white">5</p>
              <p className="mt-1">Core teaching dimensions scored consistently.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-2xl font-semibold text-white">24/7</p>
              <p className="mt-1">Interview links candidates can complete on their own time.</p>
            </div>
          </div>
        </section>

        <section className="auth-form-wrap">
          <div className="auth-form-frame space-y-6">
            <div className="space-y-2 text-center lg:text-left">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-sky-700">
                {eyebrow}
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">{title}</h2>
              <p className="text-sm leading-6 text-slate-600">{description}</p>
            </div>
            {children}
            {footer ? <div className="text-sm text-slate-500">{footer}</div> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
