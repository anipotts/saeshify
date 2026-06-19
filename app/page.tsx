import Link from "next/link";
import { Github } from "lucide-react";
import { fixtureTracks } from "@/lib/analysis/fixtures";
import { buildFixtureAnalysis } from "@/lib/analysis/adapters/fixture";
import RhymeCanvas from "@/components/rhyme-canvas";

export default async function HomePage() {
  const demo = await buildFixtureAnalysis(fixtureTracks[0]);

  return (
    <main className="min-h-screen bg-[#050505] px-5 py-5 text-white sm:px-7 lg:px-9">
      <div className="mx-auto grid min-h-[calc(100vh-40px)] max-w-[1480px] grid-rows-[auto_1fr]">
        <nav className="flex items-center justify-between pb-4 text-sm">
          <Link href="/" className="text-lg font-semibold tracking-normal">
            saeshify
          </Link>
          <div className="flex items-center gap-4 text-white/58 sm:gap-7">
            <Link href="/instrument" className="hover:text-white">
              instrument
            </Link>
            <a href="https://github.com/anipotts/saeshify" className="hover:text-white">
              <span className="hidden sm:inline">source</span>
              <Github className="sm:hidden" size={18} aria-label="source" />
            </a>
          </div>
        </nav>

        <section className="grid items-center gap-8 py-6 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:gap-9">
          <div className="min-w-0 max-w-[640px]">
            <h1 className="text-[clamp(4.4rem,7vw,6.8rem)] font-black leading-[0.82] tracking-normal">
              saeshify
            </h1>
            <p className="mt-5 max-w-xl text-[clamp(1.2rem,1.8vw,1.55rem)] leading-[1.34] text-white/78">
              live rhyme instrumentation for spotify playback clocks.
            </p>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/46 sm:text-base sm:leading-7">
              watches playback state, reconciles the clock, scores timed-word streams, then renders a Spited-style
              rhyme layer in sync.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/instrument"
                className="inline-flex h-11 items-center rounded-[4px] bg-white px-4 text-sm font-semibold text-black"
              >
                open instrument
              </Link>
              <a
                href="https://github.com/anipotts/saeshify"
                className="inline-flex h-11 items-center gap-2 rounded-[4px] border border-white/22 px-4 text-sm font-semibold text-white hover:border-white/40"
              >
                source <Github size={15} />
              </a>
            </div>
          </div>

          <div className="min-w-0 rounded-[5px] border border-white/16 bg-[#d9d9d9] p-2 text-black shadow-[0_24px_80px_rgb(0_0_0/0.45)]">
            <div className="mb-2 flex items-center justify-between bg-black px-4 py-3 text-white">
              <span className="truncate pr-4 text-sm font-black uppercase">fixture rhyme map</span>
              <span className="mono shrink-0 text-xs text-white/60">00:05.200</span>
            </div>
            <RhymeCanvas analysis={demo} currentMs={5200} compact />
          </div>
        </section>
      </div>
    </main>
  );
}
