export function shortAddr(a?: string): string {
  if (!a) return "—";
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export function compact(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}k`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

// Deterministic playful handle from an address, so the leaderboard/feed reads
// like people instead of hex. No randomness (stable across renders).
const ADJ = [
  "Turbo", "Neon", "Hyper", "Cosmic", "Volt", "Blitz", "Mega", "Lunar",
  "Pixel", "Rapid", "Solar", "Echo", "Vivid", "Nova", "Drift", "Pulse",
];
const NOUN = [
  "Nad", "Raver", "Builder", "Striker", "Phoenix", "Comet", "Ranger", "Maxi",
  "Wizard", "Falcon", "Surfer", "Ace", "Ghost", "Titan", "Spark", "Viper",
];

export function handleFor(addr: string): string {
  const h = addr.toLowerCase();
  const a = parseInt(h.slice(2, 6), 16) % ADJ.length;
  const b = parseInt(h.slice(6, 10), 16) % NOUN.length;
  const num = parseInt(h.slice(-3), 16) % 100;
  return `${ADJ[a]}${NOUN[b]}${num}`;
}
