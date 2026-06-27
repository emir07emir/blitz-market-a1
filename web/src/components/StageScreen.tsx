"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import type { BlitzEvent } from "@/lib/events";
import { REACTIONS, REACTION_EMOJI } from "@/lib/events";
import { compact, handleFor } from "@/lib/format";

type Activity = {
  id: string;
  type: "claim" | "react";
  user: string;
  kind?: number;
  score?: number;
  ts: number;
  seq?: number;
};

type Feed = {
  deployed: boolean;
  counters: { attendeeCount: number; totalTx: number; reactions: number[] };
  feed: Activity[];
  leaderboard: { user: string; score: number }[];
};

// stable pool of fake identities for fallback "seed" mode
function makePool(n: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    let h = "0x";
    for (let j = 0; j < 40; j++) h += "0123456789abcdef"[Math.floor(Math.random() * 16)];
    out.push(h);
  }
  return out;
}

export function StageScreen({ event }: { event: BlitzEvent }) {
  const [joinUrl, setJoinUrl] = useState(`/e/${event.slug}`);
  const [base, setBase] = useState<Feed>({
    deployed: true,
    counters: { attendeeCount: 0, totalTx: 0, reactions: [0, 0, 0, 0, 0] },
    feed: [],
    leaderboard: [],
  });
  const [demo, setDemo] = useState(false);
  const [tps, setTps] = useState(0);
  const [peak, setPeak] = useState(0);

  // synthetic overlay (fallback seed mode)
  const extra = useRef({
    tx: 0,
    attendees: 0,
    reactions: [0, 0, 0, 0, 0] as number[],
    feed: [] as Activity[],
    scores: new Map<string, number>(),
    seq: 0,
  });
  const pool = useRef<string[]>([]);
  if (pool.current.length === 0) pool.current = makePool(40);

  useEffect(() => {
    setJoinUrl(`${window.location.origin}/e/${event.slug}`);
  }, [event.slug]);

  // poll real chain state
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const r = await fetch(`/api/feed?eventId=${event.id}`, { cache: "no-store" });
        const d: Feed = await r.json();
        if (!alive || !d?.counters) return;
        setBase(d);
        if (d.deployed === false) setDemo(true);
      } catch {
        /* keep last */
      }
    };
    tick();
    const id = setInterval(tick, 1300);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [event.id]);

  // keyboard: 'd' demo seed, 'c' chaos burst
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "d") setDemo((v) => !v);
      if (e.key === "c") chaos(40);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addSynthetic = (count: number) => {
    const e = extra.current;
    for (let i = 0; i < count; i++) {
      const user = pool.current[Math.floor(Math.random() * pool.current.length)];
      const kind = Math.floor(Math.random() * REACTIONS.length);
      const sc = (e.scores.get(user) ?? 0) + 1;
      e.scores.set(user, sc);
      e.tx += 1;
      e.reactions[kind] += 1;
      if (Math.random() < 0.12) e.attendees += 1;
      e.feed.unshift({
        id: `s${e.seq++}`,
        type: "react",
        user,
        kind,
        score: sc,
        ts: Math.floor(Date.now() / 1000),
        seq: e.seq,
      });
    }
    if (e.feed.length > 80) e.feed.length = 80;
  };

  const chaos = (n: number) => {
    setDemo(true);
    addSynthetic(n);
  };

  // demo seeding loop
  useEffect(() => {
    if (!demo) return;
    const id = setInterval(() => addSynthetic(1 + Math.floor(Math.random() * 3)), 230);
    return () => clearInterval(id);
  }, [demo]);

  // merged view model
  const view = useMemo(() => {
    const e = extra.current;
    const counters = {
      attendeeCount: base.counters.attendeeCount + e.attendees,
      totalTx: base.counters.totalTx + e.tx,
      reactions: base.counters.reactions.map((v, i) => v + (e.reactions[i] ?? 0)),
    };
    // feed merge
    const feed = [...e.feed, ...base.feed]
      .sort((a, b) => (b.ts - a.ts) || ((b.seq ?? 0) - (a.seq ?? 0)))
      .slice(0, 26);
    // leaderboard merge
    const scores = new Map<string, number>();
    for (const l of base.leaderboard) scores.set(l.user, l.score);
    for (const [u, s] of e.scores) scores.set(u, (scores.get(u) ?? 0) + s);
    const leaderboard = [...scores.entries()]
      .map(([user, score]) => ({ user, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    return { counters, feed, leaderboard };
    // recompute on each base change or demo tick (tps interval triggers re-render)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, tps]);

  // TPS sampler
  const samples = useRef<{ t: number; tx: number }[]>([]);
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      const tx = base.counters.totalTx + extra.current.tx;
      samples.current.push({ t: now, tx });
      while (samples.current.length && now - samples.current[0].t > 2000) {
        samples.current.shift();
      }
      const first = samples.current[0];
      const dt = (now - first.t) / 1000;
      const v = dt > 0 ? (tx - first.tx) / dt : 0;
      setTps(v);
      setPeak((p) => Math.max(p, v));
    }, 250);
    return () => clearInterval(id);
  }, [base]);

  const totalAttendees = Math.max(event.baseCrowd, view.counters.attendeeCount);
  const totalReactions = view.counters.reactions.reduce((a, b) => a + b, 0);

  return (
    <main className="grain relative flex h-dvh flex-col overflow-hidden">
      {/* immersive backdrop tint */}
      <div className="pointer-events-none absolute inset-0 opacity-30" style={{ background: event.gradient }} />

      {/* header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-4">
          <span className="font-display text-3xl">⚡ BLITZPASS</span>
          <span className="hidden h-6 w-px bg-white/20 md:block" />
          <span className="hidden whitespace-pre-line font-display text-2xl uppercase md:block">
            {event.title.replace("\n", " ")}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-bold uppercase tracking-widest">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500 live-dot text-red-500" /> Live
          </span>
          <span className="font-mono text-sm text-paper/60">chain 10143</span>
        </div>
      </header>

      <div className="relative z-10 grid flex-1 grid-cols-1 gap-6 overflow-hidden px-8 pb-6 lg:grid-cols-[300px_1fr_340px]">
        {/* LEFT — QR + join */}
        <aside className="flex flex-col gap-5 overflow-hidden">
          <div className="rounded-[var(--radius-card)] bg-white p-5 text-ink">
            <div className="mb-3 text-center text-sm font-extrabold uppercase tracking-widest">
              Scan to join
            </div>
            <div className="flex justify-center rounded-2xl bg-white p-2">
              <QRCodeSVG value={joinUrl} size={210} level="M" />
            </div>
            <div className="mt-3 break-all text-center font-mono text-[11px] text-ink/60">
              {joinUrl.replace(/^https?:\/\//, "")}
            </div>
          </div>
          <div className="rounded-[var(--radius-card)] border border-white/10 panel p-4">
            <div className="mb-2 text-xs font-bold uppercase tracking-widest text-paper/50">
              Reactions
            </div>
            <div className="grid grid-cols-5 gap-1 text-center">
              {REACTIONS.map((r, i) => (
                <div key={r.kind} className="rounded-lg bg-white/5 py-2">
                  <div className="text-2xl">{r.emoji}</div>
                  <div className="font-mono text-xs tabular text-paper/70">
                    {compact(view.counters.reactions[i] ?? 0)}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-auto text-center text-xs text-paper/40">
            no app · no seed phrase · no gas
          </p>
        </aside>

        {/* CENTER — counters + feed */}
        <section className="flex flex-col gap-5 overflow-hidden">
          <div className="grid grid-cols-3 gap-4">
            <Stat label="In the room" value={compact(totalAttendees)} color="var(--color-sun)" />
            <Stat label="On-chain txs" value={compact(view.counters.totalTx)} color="var(--color-punch)" pulse />
            <Stat
              label="Live TPS"
              value={tps.toFixed(tps >= 100 ? 0 : 1)}
              sub={`peak ${peak.toFixed(0)}`}
              color="var(--color-sky)"
            />
          </div>

          <div className="flex flex-1 flex-col overflow-hidden rounded-[var(--radius-card)] border border-white/10 panel">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
              <h2 className="font-display text-xl uppercase">Live activity</h2>
              <span className="font-mono text-xs text-paper/50">{compact(totalReactions)} reactions</span>
            </div>
            <div className="no-scrollbar flex-1 space-y-1 overflow-hidden px-3 py-3">
              {view.feed.length === 0 && (
                <div className="px-2 py-6 text-center text-sm text-paper/40">
                  Waiting for the first tap… scan the QR to start.
                </div>
              )}
              {view.feed.map((a) => (
                <div
                  key={a.id}
                  className="pop-in flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2"
                >
                  <span className="text-2xl">
                    {a.type === "claim" ? "🎟️" : REACTION_EMOJI[a.kind ?? 0]}
                  </span>
                  <span className="font-semibold">{handleFor(a.user)}</span>
                  <span className="text-sm text-paper/50">
                    {a.type === "claim" ? "claimed a BlitzPass" : "reacted"}
                  </span>
                  <span className="ml-auto font-mono text-xs text-lime">on-chain ✓</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* RIGHT — leaderboard */}
        <aside className="flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-white/10 panel">
          <div className="border-b border-white/10 px-5 py-3">
            <h2 className="font-display text-xl uppercase">🏆 Most active</h2>
          </div>
          <div className="no-scrollbar flex-1 space-y-1.5 overflow-hidden px-3 py-3">
            {view.leaderboard.length === 0 && (
              <div className="px-2 py-6 text-center text-sm text-paper/40">
                Be the first to top the board.
              </div>
            )}
            {view.leaderboard.map((l, i) => (
              <div
                key={l.user}
                className="flex items-center gap-3 rounded-xl px-3 py-2"
                style={{
                  background:
                    i === 0
                      ? "linear-gradient(90deg, rgba(255,201,60,0.25), transparent)"
                      : "rgba(255,255,255,0.03)",
                }}
              >
                <span
                  className={`w-6 text-center font-display text-lg ${
                    i === 0 ? "text-sun" : i === 1 ? "text-paper" : i === 2 ? "text-flame" : "text-paper/40"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="truncate font-semibold">{handleFor(l.user)}</span>
                <span className="ml-auto font-mono font-bold tabular text-punch">{l.score}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => setDemo((v) => !v)}
            className="border-t border-white/10 px-5 py-3 text-left text-xs font-semibold text-paper/40 transition-colors hover:text-paper"
          >
            {demo ? "■ seed mode ON — press D to stop" : "▶ press D for seed mode · C for chaos"}
          </button>
        </aside>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  sub,
  color,
  pulse,
}: {
  label: string;
  value: string;
  sub?: string;
  color: string;
  pulse?: boolean;
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-white/10 panel p-5">
      <div className="text-xs font-bold uppercase tracking-widest text-paper/50">{label}</div>
      <div
        className={`font-display text-5xl tabular xl:text-6xl ${pulse ? "transition-all" : ""}`}
        style={{ color }}
      >
        {value}
      </div>
      {sub && <div className="font-mono text-xs text-paper/40">{sub}</div>}
    </div>
  );
}
