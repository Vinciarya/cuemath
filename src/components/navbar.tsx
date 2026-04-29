import Link from "next/link";
import React from "react";

function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-20 items-center justify-between gap-4 px-6 lg:px-10">
        <div className="flex items-center gap-4">
          <Link href={"/dashboard"} className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white shadow-lg shadow-slate-300">
              CM
            </div>
            <div className="space-y-0.5">
              <p className="text-lg font-semibold tracking-tight text-slate-950">
                CueMath
              </p>
              <p className="text-sm text-slate-500">Cuemath tutor screening workspace</p>
            </div>
          </Link>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
            Recruiter Workspace
          </div>
          <div className="rounded-full bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700">
            Cuemath
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
