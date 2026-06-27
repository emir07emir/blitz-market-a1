"use client";
import { useEffect, useState } from "react";
import { compact } from "@/lib/format";

type Feed = {
  deployed: boolean;
  counters: { attendeeCount: number; totalTx: number; reactions: number[] };
};

export function LiveTicker({ eventId = 1, base = 64 }: { eventId?: number; base?: number }) {
  const [c, setC] = useState({ attendees: base, tx: base * 3, reactions: base * 2 });

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const r = await fetch(`/api/feed?eventId=${eventId}`, { cache: "no-store" });
        const d: Feed = await r.json();
        if (!alive || !d?.counters) return;
        const reactions = d.counters.reactions.reduce((a, b) => a + b, 0);
        setC({
          attendees: Math.max(base, d.counters.attendeeCount),
          tx: Math.max(base * 3, d.counters.totalTx),
          reactions: Math.max(base * 2, reactions),
        });
      } catch {
        /* keep last / seeded numbers — never looks dead */
      }
    };
    tick();
    const id = setInterval(tick, 2500);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [eventId, base]);

  const items = [
    `🎟️ ${compact(c.attendees)} passes claimed`,
    `⚡ ${compact(c.tx)} on-chain txs`,
    `🔥 ${compact(c.reactions)} live reactions`,
    `🟢 400ms blocks · 10,000 TPS`,
    `📍 Monad Blitz · Ankara`,
  ];
  const doubled = [...items, ...items];

  return (
    <div className="marquee border-y border-white/10 bg-black/30 py-3">
      <div className="marquee-track font-mono text-sm font-bold uppercase tracking-wider text-paper/80">
        {doubled.map((t, i) => (
          <span key={i} className="inline-flex items-center gap-2">
            {t}
            <span className="text-punch">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
