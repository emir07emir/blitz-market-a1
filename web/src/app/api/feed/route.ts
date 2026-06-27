import { NextResponse } from "next/server";
import { getEventState } from "@/lib/indexer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const eventId = Number(searchParams.get("eventId") || "1");
  if (!Number.isInteger(eventId)) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  try {
    const state = await getEventState(eventId);
    return NextResponse.json(state, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message ?? "feed_failed" },
      { status: 500 }
    );
  }
}
