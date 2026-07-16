import { notFound } from "next/navigation";
import { loadExample } from "@/lib/examples";
import { PublicChat } from "@/components/public-chat";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ corregir?: string }>;
}

export const dynamic = "force-dynamic";

export default async function ProbarPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { corregir } = await searchParams;
  const example = await loadExample(slug);
  if (!example) notFound();

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center px-4 py-10">
      <PublicChat
        exampleId={example.id}
        exampleSlug={example.slug}
        exampleName={example.name}
        agentName={example.agent_name}
        avatarKey={example.agent_avatar_key}
        corregir={corregir === "1"}
      />
    </div>
  );
}
