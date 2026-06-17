import Link from "next/link";
import { ArrowRight, LockKeyhole, Radio, Server, Waves } from "lucide-react";
import { fixtureTracks } from "@/lib/analysis/fixtures";
import { buildFixtureAnalysis } from "@/lib/analysis/adapters/fixture";
import RhymeCanvas from "@/components/rhyme-canvas";

export default async function HomePage() {
  const demo = await buildFixtureAnalysis(fixtureTracks[0]);

  return (
    <main className="min-h-screen">
      <section className="border-b border-black bg-black text-white">
        <div className="mx-auto grid min-h-[92vh] max-w-7xl grid-rows-[auto_1fr] px-5 py-5 md:px-8">
          <nav className="flex items-center justify-between text-sm">
            <Link href="/" className="font-semibold tracking-tight">
              saeshify
            </Link>
            <div className="flex items-center gap-4 text-white/70">
              <Link href="/instrument" className="hover:text-white">
                instrument
              </Link>
              <a href="https://github.com/anipotts/saeshify" className="hover:text-white">
                source
              </a>
            </div>
          </nav>

          <div className="grid items-center gap-10 py-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="max-w-2xl">
              <p className="mono mb-5 text-xs uppercase tracking-[0.22em] text-white/55">
                live backend/io for rhyme schemes
              </p>
              <h1 className="text-5xl font-black leading-[0.96] tracking-normal md:text-7xl">
                realtime rhyme instrumentation.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-white/72">
                watches your own spotify playback, scores lyric and timing sources, computes phonetic rhyme families, and renders the verse as the clock moves.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/instrument"
                  className="inline-flex h-11 items-center gap-2 rounded-md bg-white px-4 text-sm font-semibold text-black"
                >
                  open local instrument <ArrowRight size={16} />
                </Link>
                <a
                  href="https://saeshify.com"
                  className="inline-flex h-11 items-center rounded-md border border-white/25 px-4 text-sm font-semibold text-white"
                >
                  cloudflare status
                </a>
              </div>
            </div>

            <div className="rounded-md border border-white/10 bg-[#d7dde2] p-3 text-black shadow-2xl">
              <div className="mb-3 flex items-center justify-between rounded-sm bg-black px-4 py-3 text-white">
                <span className="text-sm font-black uppercase">sample verse - rhyme map</span>
                <span className="mono text-xs text-white/60">fixture mode</span>
              </div>
              <RhymeCanvas analysis={demo} currentMs={5200} compact />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 py-8 md:grid-cols-2 lg:grid-cols-4 md:px-8">
        <InfoCard icon={<Radio size={20} />} title="playback watcher">
          spotify has no playback webhook, so saeshify polls now-playing, backs off on rate limits, and interpolates the local clock between samples.
        </InfoCard>
        <InfoCard icon={<Server size={20} />} title="analysis pipeline">
          multiple adapters race in parallel. the scorer caches the best timed word stream for the track.
        </InfoCard>
        <InfoCard icon={<Waves size={20} />} title="dense rhyme view">
          exact tails, internal rhymes, line endings, and near rhymes become color families with inspectable confidence.
        </InfoCard>
        <InfoCard icon={<LockKeyhole size={20} />} title="public-safe repo">
          github ships fixtures and architecture only. real spotify testing stays local until source boundaries are explicit.
        </InfoCard>
      </section>
    </main>
  );
}

function InfoCard({
  icon,
  title,
  children
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-md border border-[var(--line)] bg-white p-5">
      <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-md bg-black text-white">{icon}</div>
      <h2 className="text-lg font-black">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{children}</p>
    </article>
  );
}
