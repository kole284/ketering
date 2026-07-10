import { BurgerIllustration } from "@/components/loading/burger-illustration";

export function LoadingScreen() {
  return (
    <main className="loading-screen flex min-h-[100svh] items-center justify-center overflow-hidden px-4">
      <div className="loading-panel loading-panel-compact" role="status" aria-live="polite" aria-label="Učitavanje sadržaja">
        <div className="intro-burger-stage" aria-hidden="true">
          <div className="intro-burger-float">
            <BurgerIllustration />
          </div>
          <div className="intro-burger-shadow" />
        </div>
      </div>
    </main>
  );
}

export default function Loading() {
  return <LoadingScreen />;
}
