import Link from "next/link";
import { EVENTS } from "@/lib/events";
import { PosterCard } from "@/components/PosterCard";
import { LiveTicker } from "@/components/LiveTicker";

export default function Home() {
  const featured = EVENTS[0];
  const rest = EVENTS.slice(1);

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6">
      {/* nav */}
      <header className="flex items-center justify-between py-5">
        <Link href="/" className="font-display text-2xl tracking-wide">
          ⚡ BLITZ<span className="text-gradient">PASS</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-paper/70 sm:inline">
            Powered by Monad
          </span>
          <Link
            href={`/e/${featured.slug}/stage`}
            className="rounded-full bg-paper px-4 py-1.5 text-sm font-bold text-ink transition-transform hover:scale-[1.03]"
          >
            Stage view ↗
          </Link>
        </div>
      </header>

      {/* hero */}
      <section className="relative grid gap-8 py-10 sm:py-16 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-wider text-paper/80">
            <span className="live-dot inline-flex text-punch">
              <span className="h-2 w-2 rounded-full bg-punch" />
            </span>
            Live on Monad Testnet
          </div>
          <h1 className="font-display text-6xl uppercase sm:text-7xl lg:text-8xl">
            The crowd is
            <br />
            <span className="text-gradient">the app.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-paper/75">
            Scan a QR, get a wallet in a second — no app, no seed phrase,{" "}
            <span className="font-semibold text-paper">no gas</span>. Claim your
            BlitzPass, fire reactions, and watch the whole room land on-chain in
            real time. Concerts, esports, festivals & meetups.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/e/${featured.slug}`}
              className="rounded-full bg-punch px-6 py-3 text-base font-bold text-white transition-transform hover:scale-[1.03]"
            >
              Join the live room →
            </Link>
            <Link
              href={`/e/${featured.slug}/stage`}
              className="rounded-full border border-white/20 px-6 py-3 text-base font-bold text-paper transition-colors hover:bg-white/10"
            >
              Open the big screen
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 font-mono text-sm text-paper/60">
            <span>
              <span className="text-lime">●</span> gasless onboarding
            </span>
            <span>
              <span className="text-sky">●</span> every tap = on-chain tx
            </span>
            <span>
              <span className="text-sun">●</span> portable proof-of-presence
            </span>
          </div>
        </div>

        {/* featured poster */}
        <div className="grid">
          <PosterCard event={featured} featured />
        </div>
      </section>

      <LiveTicker eventId={featured.id} base={featured.baseCrowd} />

      {/* lineup */}
      <section className="py-12">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-display text-4xl uppercase sm:text-5xl">The Lineup</h2>
          <span className="font-mono text-sm text-paper/60">
            {EVENTS.length} live experiences
          </span>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((e) => (
            <PosterCard key={e.id} event={e} />
          ))}
        </div>
      </section>

      {/* why monad */}
      <section className="my-8 rounded-[var(--radius-card)] border border-white/10 panel p-8 sm:p-12">
        <h2 className="font-display text-3xl uppercase sm:text-4xl">
          Why this is a <span className="text-gradient">Monad</span> app
        </h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {[
            {
              t: "Real txs, not a database",
              d: "Every claim and reaction is a live on-chain transaction. The stage screen shows the tx + TPS counter climbing — proof you're watching the chain.",
              c: "var(--color-sun)",
            },
            {
              t: "Built for the burst",
              d: "A whole room reacting at once is exactly what Monad's parallel execution, 400ms blocks and 10k TPS are for. It stays instant under load.",
              c: "var(--color-punch)",
            },
            {
              t: "Yours to keep",
              d: "Your BlitzPass and reaction history live in your wallet — portable proof-of-presence that outlives the night.",
              c: "var(--color-sky)",
            },
          ].map((x) => (
            <div key={x.t}>
              <div className="mb-2 h-1 w-10 rounded-full" style={{ background: x.c }} />
              <h3 className="text-lg font-bold">{x.t}</h3>
              <p className="mt-1 text-sm text-paper/70">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="flex flex-col items-center justify-between gap-3 border-t border-white/10 py-8 text-sm text-paper/50 sm:flex-row">
        <span>Built for Monad Blitz Ankara</span>
        <span className="font-mono">testnet · chainId 10143</span>
      </footer>
    </main>
  );
}
