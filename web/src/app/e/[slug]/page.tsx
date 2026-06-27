import { notFound } from "next/navigation";
import { getEvent } from "@/lib/events";
import { JoinRoom } from "@/components/JoinRoom";

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) notFound();
  return <JoinRoom event={event} />;
}
