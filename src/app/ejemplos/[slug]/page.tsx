import { notFound } from "next/navigation";
import { loadExample } from "@/lib/examples";
import { ChatPanel } from "@/components/chat-panel";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function EjemploChatPage({ params }: PageProps) {
  const { slug } = await params;
  const example = await loadExample(slug);
  if (!example) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <ChatPanel exampleId={example.id} exampleName={example.name} />
    </div>
  );
}
