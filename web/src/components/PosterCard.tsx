import Link from "next/link";
import type { BlitzEvent } from "@/lib/events";
import { compact } from "@/lib/format";

const CATEGORY_EMOJI: Record<string, string> = {
  Hackathon: "⚡",
  Concert: "🎤",
  Esports: "🎮",
  Festival: "🎪",
  Club: "🎧",
  Meetup: "🛠️",
};

export function PosterCard({ event, featured = false }: { event: BlitzEvent; featured?: boolean }) {
  return (
    <Link
      href={`/e/${event.slug}`}
      className={`group relative block overflow-hidden rounded-[var(--radius-card)] border border-white/10 transition-transform duration-300 hover:-translate-y-1 ${
        featured ? "sm:col-span-2 sm:row-span-2" : ""
      }`}
    >
      {/* poster cover */}
      <div
        className="grain relative flex h-full min-h-[16rem] flex-col justify-between p-5 sm:p-6"
        style={{ background: event.gradient, color: event.ink }}
      >
        {/* top row */}
        <div className="relative z-10 flex items-start justify-between gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full bg-black/25 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm"
            style={{ color: event.ink }}
          >
            {CATEGORY_EMOJI[event.category]} {event.category}
          </span>
          {event.live ? (
            <span className="live-dot inline-flex items-center gap-1.5 rounded-full bg-black/35 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
              <span className="h-2 w-2 rounded-full bg-white" /> Live
            </span>
          ) : event.hot ? (
            <span className="rounded-full bg-black/30 px-3 py-1 text-xs font-bold uppercase tracking-wider">
              🔥 Trending
            </span>
          ) : null}
        </div>

        {/* title */}
        <div className="relative z-10 mt-6">
          <h3
            className={`font-display whitespace-pre-line uppercase ${
              featured ? "text-5xl sm:text-7xl" : "text-4xl sm:text-5xl"
            }`}
          >
            {event.title}
          </h3>
          <p className="mt-1 text-sm font-semibold opacity-90">{event.subtitle}</p>
        </div>

        {/* meta */}
        <div className="relative z-10 mt-6 space-y-3">
          <div className="flex flex-wrap gap-2">
            {event.tags.map((t) => (
              <span
                key={t}
                className="rounded-md bg-black/25 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide backdrop-blur-sm"
              >
                {t}
              </span>
            ))}
          </div>
          <div className="flex items-end justify-between">
            <div className="text-sm font-semibold">
              <div className="opacity-95">{event.venue}</div>
              <div className="opacity-80">
                {event.city} · {event.date}
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-lg font-bold tabular">
                {compact(event.baseCrowd)}+
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-wide opacity-80">
                joining
              </div>
            </div>
          </div>
        </div>

        {/* hover sheen */}
        <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-70" />
      </div>

      {/* CTA footer */}
      <div className="flex items-center justify-between bg-ink-2 px-5 py-3">
        <span className="text-sm font-semibold text-paper/80">Tap to join the room</span>
        <span
          className="font-display text-lg transition-transform group-hover:translate-x-1"
          style={{ color: event.accent }}
        >
          →
        </span>
      </div>
    </Link>
  );
}
