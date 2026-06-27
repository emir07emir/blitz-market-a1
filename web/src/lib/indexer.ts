import "server-only";
import { CONTRACT_ABI, CONTRACT_ADDRESS, isDeployed, publicClient } from "./contract";

// Lightweight in-memory indexer for the stage screen. Counters come straight
// from on-chain views (authoritative); the activity feed + leaderboard are
// aggregated from Claimed/Reacted logs. Each poll re-scans a recent block
// window and de-dups, so we never miss recent events while bounding RPC cost.
// (In production this is where Envio HyperIndex would slot in.)

const MAX_RANGE = 500n; // blocks scanned per poll (~3 min at 400ms blocks)

export type Activity = {
  id: string; // `${txHash}:${logIndex}`
  type: "claim" | "react";
  user: string;
  kind?: number;
  attendeeNumber?: number;
  score?: number;
  ts: number; // unix seconds (on-chain)
  block: number;
};

type EventStore = {
  seen: Set<string>;
  activity: Activity[]; // newest-first, capped
  scores: Map<string, number>;
  attendeesSeen: Set<string>;
  lastScanned: bigint | null;
};

const stores = new Map<number, EventStore>();

function store(eventId: number): EventStore {
  let s = stores.get(eventId);
  if (!s) {
    s = {
      seen: new Set(),
      activity: [],
      scores: new Map(),
      attendeesSeen: new Set(),
      lastScanned: null,
    };
    stores.set(eventId, s);
  }
  return s;
}

function pushActivity(s: EventStore, a: Activity) {
  if (s.seen.has(a.id)) return;
  s.seen.add(a.id);
  s.activity.unshift(a);
  if (s.activity.length > 600) s.activity.length = 600;
  if (a.type === "react" && typeof a.score === "number") {
    const prev = s.scores.get(a.user) ?? 0;
    if (a.score > prev) s.scores.set(a.user, a.score);
  }
  s.attendeesSeen.add(a.user);
}

async function syncLogs(eventId: number) {
  if (!isDeployed) return;
  const s = store(eventId);
  const latest = await publicClient.getBlockNumber();
  const from =
    s.lastScanned && latest - s.lastScanned < MAX_RANGE
      ? s.lastScanned + 1n
      : latest > MAX_RANGE
      ? latest - MAX_RANGE
      : 0n;

  const id = BigInt(eventId);

  const [claims, reacts] = await Promise.all([
    publicClient.getContractEvents({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: CONTRACT_ABI,
      eventName: "Claimed",
      args: { eventId: id },
      fromBlock: from,
      toBlock: latest,
    }),
    publicClient.getContractEvents({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: CONTRACT_ABI,
      eventName: "Reacted",
      args: { eventId: id },
      fromBlock: from,
      toBlock: latest,
    }),
  ]);

  for (const log of claims) {
    const a = log.args as {
      user?: string;
      attendeeNumber?: bigint;
      timestamp?: bigint;
    };
    if (!a.user) continue;
    pushActivity(s, {
      id: `${log.transactionHash}:${log.logIndex}`,
      type: "claim",
      user: a.user,
      attendeeNumber: Number(a.attendeeNumber ?? 0n),
      ts: Number(a.timestamp ?? 0n),
      block: Number(log.blockNumber ?? 0n),
    });
  }

  for (const log of reacts) {
    const a = log.args as {
      user?: string;
      kind?: number;
      newScore?: bigint;
      timestamp?: bigint;
    };
    if (!a.user) continue;
    pushActivity(s, {
      id: `${log.transactionHash}:${log.logIndex}`,
      type: "react",
      user: a.user,
      kind: Number(a.kind ?? 0),
      score: Number(a.newScore ?? 0n),
      ts: Number(a.timestamp ?? 0n),
      block: Number(log.blockNumber ?? 0n),
    });
  }

  s.lastScanned = latest;
}

async function readCounters(eventId: number) {
  if (!isDeployed) {
    return { attendeeCount: 0, totalTx: 0, reactions: [0, 0, 0, 0, 0] };
  }
  const id = BigInt(eventId);
  const reactionKinds = [0, 1, 2, 3, 4];
  const [attendeeCount, totalTx, ...tallies] = await Promise.all([
    publicClient.readContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: CONTRACT_ABI,
      functionName: "attendeeCount",
      args: [id],
    }) as Promise<bigint>,
    publicClient.readContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: CONTRACT_ABI,
      functionName: "totalTx",
    }) as Promise<bigint>,
    ...reactionKinds.map(
      (k) =>
        publicClient.readContract({
          address: CONTRACT_ADDRESS as `0x${string}`,
          abi: CONTRACT_ABI,
          functionName: "reactionTally",
          args: [id, k],
        }) as Promise<bigint>
    ),
  ]);

  return {
    attendeeCount: Number(attendeeCount),
    totalTx: Number(totalTx),
    reactions: tallies.map((t) => Number(t)),
  };
}

export async function getEventState(eventId: number) {
  const [counters] = await Promise.all([readCounters(eventId), syncLogs(eventId)]);
  const s = store(eventId);

  const leaderboard = [...s.scores.entries()]
    .map(([user, score]) => ({ user, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 15);

  return {
    deployed: isDeployed,
    counters,
    feed: s.activity.slice(0, 40),
    leaderboard,
  };
}
