"use client";

import { AVATAR_PRESETS } from "@/lib/avatars";
import { AgentAvatar } from "@/components/agent-avatar";
import { cn } from "@/lib/utils";

interface Props {
  name: string;
  value: string;
  onChange: (key: string) => void;
}

export function AvatarPicker({ name, value, onChange }: Props) {
  return (
    <div role="radiogroup" aria-label="Avatar del agente" className="flex flex-wrap gap-2">
      {AVATAR_PRESETS.map((preset) => (
        <button
          key={preset.key}
          type="button"
          role="radio"
          aria-checked={value === preset.key}
          title={preset.label}
          onClick={() => onChange(preset.key)}
          className={cn(
            "rounded-full p-0.5 transition-all",
            value === preset.key
              ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
              : "opacity-60 hover:opacity-100",
          )}
        >
          <AgentAvatar name={name || "?"} avatarKey={preset.key} className="h-9 w-9 text-sm" />
        </button>
      ))}
    </div>
  );
}
