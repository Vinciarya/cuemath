export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-slate-200 bg-white px-8 py-8 shadow-lg shadow-slate-200/40">
        <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
        <div className="mt-4 h-10 w-72 animate-pulse rounded bg-slate-200" />
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/40">
        <div className="mb-6 flex items-center justify-between">
          <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
          <div className="h-11 w-32 animate-pulse rounded-xl bg-slate-200" />
        </div>

        <div className="space-y-3">
          {[0, 1, 2].map((row) => (
            <div key={row} className="grid grid-cols-6 gap-4 rounded-2xl bg-slate-50 px-4 py-4">
              {[0, 1, 2, 3, 4, 5].map((cell) => (
                <div key={cell} className="h-4 animate-pulse rounded bg-slate-200" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
