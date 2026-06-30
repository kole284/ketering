export function LoadingScreen() {
  return (
    <main className="loading-screen flex min-h-[100svh] items-center justify-center overflow-hidden px-4">
      <div className="loading-panel" role="status" aria-live="polite">
        <p className="text-sm font-semibold uppercase text-[color:var(--primary)]">KeteringGo</p>
        <h1 className="mt-3 text-2xl font-semibold text-[color:var(--foreground)]">Učitavamo ponudu</h1>
        <p className="mt-2 text-sm leading-6 text-[color:var(--muted-foreground)]">
          Pripremamo dostupne restorane i termine isporuke.
        </p>
        <div className="loading-line mt-6" aria-hidden="true" />
      </div>
    </main>
  );
}

export default function Loading() {
  return <LoadingScreen />;
}
