import Link from "next/link";
import { Github } from "lucide-react";

const steps = [
  {
    label: "spotify poll",
    text: "now-playing snapshots, 204/401/429 backoff, active tab cadence."
  },
  {
    label: "clock reconcile",
    text: "server samples, browser interpolation, seek and pause correction."
  },
  {
    label: "adapters",
    text: "fixture lrc, private local lrc, local alignment worker later."
  },
  {
    label: "scorer cache",
    text: "word coverage, timestamp density, source priority, best stream wins."
  },
  {
    label: "rhyme renderer",
    text: "bar-level rhyme families, word-level karaoke timing, ghost future text."
  }
];

export const metadata = {
  title: "system - saeshify",
  description: "clock in. timed words out."
};

export default function SystemPage() {
  return (
    <main className="min-h-screen bg-[#050505] px-5 py-5 text-white sm:px-7 lg:px-9">
      <div className="mx-auto grid min-h-[calc(100vh-40px)] max-w-[1180px] grid-rows-[auto_1fr]">
        <nav className="flex items-center justify-between pb-4 text-sm">
          <Link href="/" className="text-lg font-semibold tracking-normal">
            saeshify
          </Link>
          <div className="flex items-center gap-4 text-white/58 sm:gap-7">
            <Link href="/instrument" className="hover:text-white">
              instrument
            </Link>
            <Link href="/system" className="text-white">
              system
            </Link>
            <a href="https://github.com/anipotts/saeshify" className="hover:text-white">
              <span className="hidden sm:inline">source</span>
              <Github className="sm:hidden" size={18} aria-label="source" />
            </a>
          </div>
        </nav>

        <section className="flex min-h-0 items-center py-10">
          <div className="w-full max-w-[860px]">
            <p className="mono text-xs uppercase text-[var(--spotify)]">system</p>
            <h1 className="mt-3 text-[clamp(3.6rem,6vw,5.8rem)] font-black leading-[0.88] tracking-normal">
              clock in.
              <br />
              timed words out.
            </h1>
            <p className="mt-6 max-w-2xl text-sm leading-6 text-white/50 sm:text-base sm:leading-7">
              playback clocks in. timed words through. rhyme layer out.
            </p>

            <div className="mt-10 divide-y divide-white/12 border-y border-white/12">
              {steps.map((step) => (
                <div key={step.label} className="grid gap-2 py-5 sm:grid-cols-[120px_1fr] sm:gap-8">
                  <div className="mono text-xs uppercase text-white/38">{step.label}</div>
                  <div className="text-[clamp(1.2rem,2vw,1.65rem)] font-semibold leading-tight text-white/88">
                    {step.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
