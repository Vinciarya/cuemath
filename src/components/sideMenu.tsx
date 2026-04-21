"use client";

import { LayoutDashboardIcon, PlayCircleIcon, SpeechIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import React from "react";

function SideMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const items = [
    {
      label: "Overview",
      icon: LayoutDashboardIcon,
      href: "/protected",
      active: pathname === "/protected",
    },
    {
      label: "Interviews",
      icon: PlayCircleIcon,
      href: "/dashboard",
      active: pathname.endsWith("/dashboard") || pathname.includes("/interviews"),
    },
    {
      label: "Interviewers",
      icon: SpeechIcon,
      href: "/dashboard/interviewers",
      active: pathname.endsWith("/interviewers"),
    },
  ];

  return (
    <aside className="fixed left-0 top-20 z-20 h-[calc(100vh-5rem)] w-[280px] border-r border-slate-200/80 bg-white/80 px-5 py-6 backdrop-blur-xl">
      <div className="flex h-full flex-col justify-between">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
              Workspace
            </p>
            <h2 className="mt-3 text-lg font-semibold tracking-tight text-slate-950">
              Hiring operations
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Manage interview links, reviewer roles, and candidate outcomes from one place.
            </p>
          </div>

          <nav className="space-y-2">
            {items.map(({ label, icon: Icon, href, active }) => (
              <button
                key={href}
                type="button"
                className={[
                  "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition-colors",
                  active
                    ? "bg-slate-950 text-white shadow-lg shadow-slate-300"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                ].join(" ")}
                onClick={() => router.push(href)}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="rounded-3xl bg-sky-50 p-5">
          <p className="text-sm font-medium text-sky-900">Interview quality</p>
          <p className="mt-2 text-sm leading-6 text-sky-800/80">
            Standardize question flow, audio prompts, and scoring so reviewer decisions stay
            consistent.
          </p>
        </div>
      </div>
    </aside>
  );
}

export default SideMenu;
