export default function RestaurantDetailsLoading() {
  return (
    <main className="min-h-screen text-slate-900">
      <div className="page-bg" />
      <section className="mx-auto w-full max-w-7xl px-3 pb-12 pt-4 sm:px-8 sm:pb-14 sm:pt-6 lg:px-10 lg:pt-8">
        <div className="glass-panel rounded-[28px] p-4 sm:p-6">
          <div className="h-56 animate-pulse rounded-2xl bg-slate-200/70 sm:h-72" />
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="h-20 animate-pulse rounded-2xl bg-slate-200/70" />
            <div className="h-20 animate-pulse rounded-2xl bg-slate-200/70" />
            <div className="h-20 animate-pulse rounded-2xl bg-slate-200/70" />
            <div className="h-20 animate-pulse rounded-2xl bg-slate-200/70" />
          </div>
        </div>
      </section>
    </main>
  );
}
