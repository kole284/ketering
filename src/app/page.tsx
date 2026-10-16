import Image from "next/image";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <Image
        src="/ketering-logo.png"
        alt="Ketering"
        width={160}
        height={160}
        priority
      />
      <h1 className="text-3xl font-semibold tracking-tight">Ketering</h1>
    </main>
  );
}
