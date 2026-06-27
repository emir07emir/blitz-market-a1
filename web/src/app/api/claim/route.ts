import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { relay, relayerReady } from "@/lib/relayer";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const eventId = Number(body?.eventId);
    const address = body?.address;

    if (!Number.isInteger(eventId) || !isAddress(address)) {
      return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }
    if (!relayerReady()) {
      return NextResponse.json({ error: "relayer_not_ready" }, { status: 503 });
    }

    const hash = await relay("claimPass", [BigInt(eventId), address]);
    return NextResponse.json({ ok: true, hash });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message ?? "relay_failed" },
      { status: 500 }
    );
  }
}
