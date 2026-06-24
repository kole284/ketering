export function LoadingScreen() {
  return (
    <main className="loading-screen flex min-h-[100svh] items-center justify-center overflow-hidden text-slate-900">
      <div className="burger-loader" aria-hidden="true">
        <div className="burger-halo absolute inset-8 rounded-full bg-[radial-gradient(circle,_rgba(255,194,68,0.24),_transparent_68%)] blur-2xl" />
        <div className="burger-orbit absolute inset-0">
          <span className="burger-orbit-ring burger-orbit-ring-a" />
          <span className="burger-orbit-ring burger-orbit-ring-b" />
          <span className="burger-orbit-ring burger-orbit-ring-c" />
        </div>

        <div className="burger-loader-inner">
          <div className="burger-shadow" />

          <div className="burger-stack burger-float">
            <span className="burger-steam burger-steam-left" />
            <span className="burger-steam burger-steam-middle" />
            <span className="burger-steam burger-steam-right" />

            <span className="burger-bun burger-bun-top">
              <span className="burger-sesame burger-sesame-1" />
              <span className="burger-sesame burger-sesame-2" />
              <span className="burger-sesame burger-sesame-3" />
              <span className="burger-sesame burger-sesame-4" />
              <span className="burger-sesame burger-sesame-5" />
            </span>

            <span className="burger-lettuce burger-lettuce-left" />
            <span className="burger-lettuce burger-lettuce-right" />
            <span className="burger-lettuce burger-lettuce-center" />
            <span className="burger-cheese burger-cheese-wave" />
            <span className="burger-patty">
              <span className="burger-grill burger-grill-1" />
              <span className="burger-grill burger-grill-2" />
              <span className="burger-grill burger-grill-3" />
            </span>
            <span className="burger-patty burger-patty-shadow" />
            <span className="burger-tomato burger-tomato-1" />
            <span className="burger-tomato burger-tomato-2" />
            <span className="burger-tomato burger-tomato-3" />
            <span className="burger-onion burger-onion-1" />
            <span className="burger-onion burger-onion-2" />
            <span className="burger-bun burger-bun-bottom" />
          </div>

          <div className="burger-status">
            <span className="burger-dot burger-dot-1" />
            <span className="burger-dot burger-dot-2" />
            <span className="burger-dot burger-dot-3" />
          </div>

          <div className="burger-glow" />
        </div>
      </div>
    </main>
  );
}

export default function Loading() {
  return <LoadingScreen />;
}
