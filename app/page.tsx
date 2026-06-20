import Link from "next/link";
import { Github } from "lucide-react";

export default function HomePage() {
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
            <Link href="/system" className="hover:text-white">
              system
            </Link>
            <a href="https://github.com/anipotts/saeshify" className="hover:text-white">
              <span className="hidden sm:inline">source</span>
              <Github className="sm:hidden" size={18} aria-label="source" />
            </a>
          </div>
        </nav>

        <section className="flex min-h-0 items-center py-10">
          <div className="min-w-0 max-w-[780px]">
            <h1 className="text-[clamp(4.4rem,7vw,6.8rem)] font-black leading-[0.82] tracking-normal">
              saeshify
            </h1>
            <p className="mt-5 max-w-xl text-[clamp(1.2rem,1.8vw,1.55rem)] leading-[1.34] text-white/78">
              live rhyme instrumentation for spotify playback clocks.
            </p>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/46 sm:text-base sm:leading-7">
              watches playback state, reconciles the clock, races lyric and alignment adapters, scores the best word
              stream, then renders a Spited-style rhyme layer in sync.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/instrument"
                className="inline-flex h-11 items-center rounded-[4px] bg-white px-4 text-sm font-semibold text-black"
              >
                open instrument
              </Link>
              <Link
                href="/system"
                className="inline-flex h-11 items-center rounded-[4px] border border-white/22 px-4 text-sm font-semibold text-white hover:border-white/40"
              >
                system
              </Link>
              <a
                href="https://github.com/anipotts/saeshify"
                className="inline-flex h-11 items-center gap-2 rounded-[4px] border border-white/22 px-4 text-sm font-semibold text-white hover:border-white/40"
              >
                source <Github size={15} />
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
