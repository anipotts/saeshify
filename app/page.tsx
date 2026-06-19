import Link from "next/link";
import { ArrowRight, Github } from "lucide-react";
import { fixtureTracks } from "@/lib/analysis/fixtures";
import { buildFixtureAnalysis } from "@/lib/analysis/adapters/fixture";
import RhymeCanvas from "@/components/rhyme-canvas";

const systemNotes = [
  ["clock", "spotify playback state, sampled and corrected locally."],
  ["analysis", "timed words, phoneme tails, source scoring."],
  ["render", "ghosted future bars, karaoke reveal, rhyme colors."]
];

export default async function HomePage() {
  const demo = await buildFixtureAnalysis(fixtureTracks[0]);

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="bg-[#050505]">
        <div className="mx-auto grid min-h-screen max-w-[1480px] grid-rows-[auto_1fr] px-5 py-5 sm:px-7 lg:px-9">
          <nav className="flex items-center justify-between pb-4 text-sm">
            <Link href="/" className="text-lg font-semibold tracking-normal">
              saeshify
            </Link>
            <div className="flex items-center gap-4 text-white/58 sm:gap-7">
              <Link href="/instrument" className="hover:text-white">
                instrument
              </Link>
              <a href="#system" className="hidden hover:text-white sm:inline">
                system
              </a>
              <a href="https://github.com/anipotts/saeshify" className="hover:text-white">
                <span className="hidden sm:inline">source</span>
                <Github className="sm:hidden" size={18} aria-label="source" />
              </a>
            </div>
          </nav>

          <div className="grid items-center gap-8 py-6 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-8">
            <div className="min-w-0 max-w-[620px]">
              <h1 className="text-[clamp(4.2rem,9vw,8rem)] font-black leading-[0.82] tracking-normal">
                saeshify
              </h1>
              <p className="mt-5 max-w-xl text-[clamp(1.2rem,1.8vw,1.55rem)] leading-[1.34] text-white/78">
                live rhyme instrumentation for spotify playback clocks.
              </p>
              <p className="mt-4 max-w-lg text-sm leading-6 text-white/46 sm:text-base sm:leading-7">
                follow a song as it plays. saeshify turns timed lyrics into color-coded rhyme families, bar by bar.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/instrument"
                  className="inline-flex h-11 items-center gap-2 rounded-[4px] bg-white px-4 text-sm font-semibold text-black"
                >
                  open local instrument <ArrowRight size={16} />
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
                <span className="truncate pr-4 text-sm font-black uppercase">
                  saeshify fixture - rhyme map
                </span>
                <span className="mono shrink-0 text-xs text-white/60">00:05.200</span>
              </div>
              <RhymeCanvas analysis={demo} currentMs={5200} compact />
            </div>
          </div>
        </div>
      </section>

      <section id="system" className="border-t border-white/10 bg-[#070707] px-5 py-8 sm:px-7 lg:px-9">
        <div className="mx-auto grid max-w-[1480px] gap-5 md:grid-cols-[0.7fr_1.3fr]">
          <h2 className="text-3xl font-black leading-none">system</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {systemNotes.map(([title, body]) => (
              <article key={title} className="border-t border-white/16 pt-3">
                <h3 className="mono text-sm text-white">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/52">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
