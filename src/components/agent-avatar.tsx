import { avatarPresetFor } from "@/lib/avatars";
import { cn } from "@/lib/utils";

interface Props {
  name: string;
  avatarKey?: string | null;
  className?: string;
}

export function AgentAvatar({ name, avatarKey, className }: Props) {
  const preset = avatarPresetFor(avatarKey);
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white",
        preset.gradient,
        className,
      )}
      title={name}
      aria-hidden="true"
    >
      {initial}
    </div>
  );
}
