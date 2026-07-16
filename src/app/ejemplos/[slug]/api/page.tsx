import { notFound } from "next/navigation";
import { loadExample } from "@/lib/examples";
import { ApiSettingsForm } from "@/components/api-settings-form";
import { AgentIdentityForm } from "@/components/agent-identity-form";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function EjemploApiPage({ params }: PageProps) {
  const { slug } = await params;
  const example = await loadExample(slug);
  if (!example) notFound();

  return (
    <div className="space-y-6">
      <AgentIdentityForm example={example} />
      <ApiSettingsForm example={example} />
    </div>
  );
}
