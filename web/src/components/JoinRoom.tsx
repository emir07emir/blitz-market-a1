"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { BlitzEvent } from "@/lib/events";
import { REACTIONS } from "@/lib/events";
import { getBurner } from "@/lib/wallet";
import { handleFor, shortAddr, compact } from "@/lib/format";
import { EXPLORER_TX } from "@/lib/chain";

type Burst = { id: number; emoji: string; x: number };

export function JoinRoom({ event }: { event: BlitzEvent }) {
  const [address, setAddress] = useState<`0x${string}` | "">("");
  const [claimed, setClaimed] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [rewarded, setRewarded] = useState(false);
  const [score, setScore] = useState(0);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [lastTx, setLastTx] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [live, setLive] = useState({ attendees: event.baseCrowd, reactions: event.baseCrowd * 2 });
  const burstId = useRef(0);

  useEffect(() => {
    try {
      setAddress(getBurner().address);
    } catch {
      /* ignore */
    }
  }, []);

  // live room counts (small)
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const r = await fetch(`/api/feed?eventId=${event.id}`, { cache: "no-store" });
        const d = await r.json();
        if (!alive || !d?.counters) return;
        const reactions = d.counters.reactions.reduce((a: number, b: number) => a + b, 0);
        setLive({
          attendees: Math.max(event.baseCrowd, d.counters.attendeeCount),
          reactions: Math.max(event.baseCrowd * 2, reactions),
        });
      } catch {
        /* keep seeded */
      }
    };
    tick();
    const id = setInterval(tick, 3000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [event.id, event.baseCrowd]);

  const flash = (msg: string) => {
    setNote(msg);
    setTimeout(() => setNote(null), 2200);
  };

  const post = useCallback(
    async (path: string, body: object) => {
      const r = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d?.error || "failed");
      return d as { hash?: string };
    },
    []
  );

  const doClaim = async () => {
    if (!address || claiming) return;
    setClaiming(true);
    setClaimed(true); // optimistic
    try {
      const d = await post("/api/claim", { eventId: event.id, address });
      if (d.hash) setLastTx(d.hash);
      setLive((s) => ({ ...s, attendees: s.attendees + 1 }));
      
      // Also reward the user
      try {
        await post("/api/reward", { eventId: event.id, address });
        setRewarded(true);
      } catch (err) {
        console.error("Reward failed", err);
      }
    } catch (e) {
      flash(
        (e as Error).message === "relayer_not_ready"
          ? "Demo warming up — pass reserved locally."
          : "Network hiccup — pass reserved."
      );
    } finally {
      setClaiming(false);
    }
  };

  const doReact = async (kind: number, emoji: string) => {
    if (!address) return;
    if (!claimed) setClaimed(true);
    setScore((s) => s + 1);
    setLive((s) => ({ ...s, reactions: s.reactions + 1 }));
    // spawn floating emoji
    const id = burstId.current++;
    const x = 10 + Math.floor(Math.random() * 80);
    setBursts((b) => [...b, { id, emoji, x }]);
    setTimeout(() => setBursts((b) => b.filter((x) => x.id !== id)), 1100);
    try {
      const d = await post("/api/react", { eventId: event.id, kind, address });
      if (d.hash) setLastTx(d.hash);
    } catch {
      /* keep optimistic; the vibe must not break */
    }
  };

  return (
    <main className="mx-auto min-h-dvh max-w-md px-4 pb-28">
      {/* cover */}
      <div
        className="grain relative -mx-4 overflow-hidden rounded-b-[var(--radius-card)] px-5 pb-6 pt-5"
        style={{ background: event.gradient, color: event.ink }}
      >
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="text-sm font-bold opacity-90">
            ← BlitzPass
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
            {event.live ? (
              <>
                <span className="h-2 w-2 rounded-full bg-white live-dot" /> Live
              </>
            ) : (
              event.category
            )}
          </span>
        </div>
        <h1 className="relative z-10 mt-8 whitespace-pre-line font-display text-5xl uppercase">
          {event.title}
        </h1>
        <p className="relative z-10 mt-1 text-sm font-semibold opacity-90">
          {event.subtitle} · {event.venue}
        </p>
        <div className="relative z-10 mt-4 flex gap-5 font-mono text-sm font-bold">
          <span>🎟️ {compact(live.attendees)}</span>
          <span>🔥 {compact(live.reactions)}</span>
        </div>
      </div>

      {/* identity */}
      <div className="mt-5 flex items-center justify-between rounded-2xl border border-white/10 panel px-4 py-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-paper/50">You</div>
          <div className="font-bold">{address ? handleFor(address) : "…"}</div>
        </div>
        <div className="text-right font-mono text-xs text-paper/50">
          {address ? shortAddr(address) : "creating wallet…"}
          <div className="text-lime">gasless · embedded</div>
        </div>
      </div>

      {/* claim / pass */}
      {!claimed ? (
        <button
          onClick={doClaim}
          disabled={!address || claiming}
          className="mt-5 w-full rounded-2xl bg-punch px-6 py-5 text-lg font-extrabold text-white transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {claiming ? "Claiming…" : "Claim your BlitzPass →"}
        </button>
      ) : (
        <div
          className="mt-5 grain relative overflow-hidden rounded-2xl p-5"
          style={{ background: event.gradient, color: event.ink }}
        >
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest opacity-80">
                BlitzPass · #{event.id}
              </div>
              <div className="font-display text-3xl uppercase">{event.title.replace("\n", " ")}</div>
              <div className="text-sm font-semibold opacity-90">
                {address ? handleFor(address) : ""}
              </div>
            </div>
            <div className="text-5xl">🎟️</div>
          </div>
          
          {rewarded && (
            <div className="relative z-10 mt-6 rounded-xl bg-black/20 p-4 text-center">
              <div className="mb-2 font-display text-xl uppercase text-sun">You earned coins! 🪙</div>
              <a
                href={`http://localhost:3001/?addr=${address}`}
                target="_blank"
                rel="noreferrer"
                className="inline-block rounded-full bg-white px-5 py-2 text-sm font-bold text-ink transition-transform active:scale-95"
              >
                Open BlitzMarket →
              </a>
            </div>
          )}
        </div>
      )}

      {/* reactions */}
      <div className="relative mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-2xl uppercase">Send it 🔊</h2>
          <span className="font-mono text-sm text-paper/60">your score · {score}</span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {REACTIONS.map((r) => (
            <button
              key={r.kind}
              onClick={() => doReact(r.kind, r.emoji)}
              disabled={!address}
              className="aspect-square rounded-2xl border border-white/10 panel text-3xl transition-transform active:scale-90 disabled:opacity-50"
              aria-label={r.label}
            >
              {r.emoji}
            </button>
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-paper/50">
          Every tap is a real transaction on Monad — watch the big screen.
        </p>

        {/* floating bursts */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 overflow-hidden">
          {bursts.map((b) => (
            <span
              key={b.id}
              className="float-up absolute bottom-0 text-3xl"
              style={{ left: `${b.x}%` }}
            >
              {b.emoji}
            </span>
          ))}
        </div>
      </div>

      {/* last tx */}
      {lastTx && (
        <a
          href={EXPLORER_TX(lastTx)}
          target="_blank"
          rel="noreferrer"
          className="mt-5 block truncate rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-center font-mono text-xs text-sky"
        >
          last tx ↗ {lastTx.slice(0, 18)}…
        </a>
      )}

      <div className="mt-6 text-center">
        <Link
          href={`/e/${event.slug}/stage`}
          className="text-sm font-semibold text-paper/60 underline-offset-4 hover:underline"
        >
          Open the big screen →
        </Link>
      </div>

      {/* toast */}
      {note && (
        <div className="fixed inset-x-0 bottom-6 z-50 mx-auto w-fit max-w-[90%] rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink shadow-lg">
          {note}
        </div>
      )}
    </main>
  );
}
