// Event catalogue. Each event maps to an on-chain `eventId` (uint256) on the
// BlitzPass contract — every event is fully functional (claim + react) even
// though only one is "live" on stage at the hackathon.

export type EventCategory =
  | "Hackathon"
  | "Concert"
  | "Esports"
  | "Festival"
  | "Club"
  | "Meetup";

export type BlitzEvent = {
  id: number; // on-chain eventId
  slug: string;
  title: string;
  subtitle: string; // artist / teams / host line
  category: EventCategory;
  venue: string;
  city: string;
  date: string; // human label
  blurb: string;
  tags: string[];
  // poster styling
  gradient: string; // CSS gradient for the cover
  ink: string; // foreground color on top of the cover
  accent: string; // brand accent used in UI chrome
  live?: boolean; // currently happening on stage
  hot?: boolean; // featured / trending
  baseCrowd: number; // seed number so a fresh event never looks empty
};

export const EVENTS: BlitzEvent[] = [
  {
    id: 1,
    slug: "monad-blitz-ankara",
    title: "MONAD BLITZ",
    subtitle: "Ankara · Builder Night",
    category: "Hackathon",
    venue: "Çankaya",
    city: "Ankara",
    date: "Tonight · Live",
    blurb:
      "The room is the app. Claim your pass, fire reactions, and watch every tap land on-chain in real time.",
    tags: ["LIVE NOW", "Consumer", "Parallel EVM"],
    gradient: "linear-gradient(135deg,#7C3AED 0%,#FF2E97 55%,#FF5A3C 100%)",
    ink: "#FFFFFF",
    accent: "#FF2E97",
    live: true,
    hot: true,
    baseCrowd: 64,
  },
  {
    id: 2,
    slug: "manifest-istanbul",
    title: "MANIFEST",
    subtitle: "Live in İstanbul",
    category: "Concert",
    venue: "Vadi İstanbul Açıkhava",
    city: "İstanbul",
    date: "Sat · 21:00",
    blurb:
      "Stadyumu titreten gece. Sahneye en yüksek tepkiyi veren 100 kişi backstage çekilişine girer.",
    tags: ["SOLD OUT", "Pop", "18+"],
    gradient: "linear-gradient(140deg,#FF5A3C 0%,#FF2E97 60%,#7C3AED 100%)",
    ink: "#FFFFFF",
    accent: "#FF5A3C",
    hot: true,
    baseCrowd: 1280,
  },
  {
    id: 3,
    slug: "valorant-champions-tr",
    title: "VALORANT\nCHAMPIONS",
    subtitle: "TR Finals · BO5",
    category: "Esports",
    venue: "Volkswagen Arena",
    city: "İstanbul",
    date: "Sun · 18:00",
    blurb:
      "Clutch geldikçe arena patlıyor. Tribün tepkisi canlı leaderboard'a düşüyor, MVP'yi salon seçiyor.",
    tags: ["Grand Final", "FPS", "Prize Pool ₺2M"],
    gradient: "linear-gradient(135deg,#0EA5E9 0%,#7C3AED 60%,#0E0B16 100%)",
    ink: "#FFFFFF",
    accent: "#2DD4FF",
    hot: true,
    baseCrowd: 940,
  },
  {
    id: 4,
    slug: "afterdark-festival",
    title: "AFTERDARK",
    subtitle: "Open-Air Festival",
    category: "Festival",
    venue: "Life Park",
    city: "İzmir",
    date: "Fri–Sun",
    blurb:
      "Üç gün, beş sahne. Her set sonunda kalabalık favori anını oyluyor, aftermovie zincirden çıkıyor.",
    tags: ["3 Days", "Camping", "5 Stages"],
    gradient: "linear-gradient(140deg,#FFC93C 0%,#FF5A3C 55%,#FF2E97 100%)",
    ink: "#1A1206",
    accent: "#FFC93C",
    baseCrowd: 2100,
  },
  {
    id: 5,
    slug: "sounds-of-monad",
    title: "SOUNDS OF\nMONAD",
    subtitle: "Night Rave",
    category: "Club",
    venue: "Kloster",
    city: "Ankara",
    date: "Sat · 23:30",
    blurb:
      "10.000 TPS'lik bir gece. DJ booth'un üstündeki ekran salonun nabzıyla atıyor.",
    tags: ["Techno", "B2B", "Late"],
    gradient: "linear-gradient(135deg,#2DD4FF 0%,#7C3AED 55%,#FF2E97 100%)",
    ink: "#FFFFFF",
    accent: "#2DD4FF",
    baseCrowd: 420,
  },
  {
    id: 6,
    slug: "web3-builders-meetup",
    title: "BUILDERS\nMEETUP",
    subtitle: "Monad Devs · Ankara",
    category: "Meetup",
    venue: "Hacettepe Teknokent",
    city: "Ankara",
    date: "Thu · 19:00",
    blurb:
      "Lightning talk'lara canlı alkış, en iyi soruya topluluk oyu — networking'in on-chain hali.",
    tags: ["Free", "Talks", "Pizza"],
    gradient: "linear-gradient(140deg,#C6FF4A 0%,#2DD4FF 55%,#7C3AED 100%)",
    ink: "#0E0B16",
    accent: "#C6FF4A",
    baseCrowd: 180,
  },
];

export const REACTIONS = [
  { kind: 0, emoji: "🔥", label: "Fire" },
  { kind: 1, emoji: "❤️", label: "Love" },
  { kind: 2, emoji: "😮", label: "Wow" },
  { kind: 3, emoji: "👏", label: "Clap" },
  { kind: 4, emoji: "🚀", label: "Hype" },
] as const;

export const REACTION_EMOJI: Record<number, string> = Object.fromEntries(
  REACTIONS.map((r) => [r.kind, r.emoji])
);

export function getEvent(slugOrId: string): BlitzEvent | undefined {
  return EVENTS.find(
    (e) => e.slug === slugOrId || String(e.id) === slugOrId
  );
}
