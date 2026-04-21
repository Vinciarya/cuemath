export default function SessionLoading() {
  return (
    <div className="space-y-8">
      <div className="h-4 w-44 animate-pulse rounded bg-slate-200" />

      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/40">
        <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
        <div className="mt-4 h-10 w-96 animate-pulse rounded bg-slate-200" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((card) => (
          <div
            key={card}
            className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-md shadow-slate-200/30"
          >
            <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
            <div className="mt-3 h-8 w-20 animate-pulse rounded bg-slate-200" />
            <div className="mt-6 h-20 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
