import { notFound } from "next/navigation";
import { getEvent } from "@/lib/events";
import { StageScreen } from "@/components/StageScreen";

export default async function StagePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) notFound();
  return <StageScreen event={event} />;
}
