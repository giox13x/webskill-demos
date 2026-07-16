export interface AvatarPreset {
  key: string;
  label: string;
  gradient: string;
}

// Igual que el picker de avatares del SaaS principal, pero sin fotos: cada
// preset es un color, y el avatar muestra la inicial del nombre del agente.
// Así no depende de subir ni alojar imágenes.
export const AVATAR_PRESETS: AvatarPreset[] = [
  { key: "blue", label: "Azul", gradient: "from-blue-500 to-indigo-600" },
  { key: "violet", label: "Morado", gradient: "from-violet-500 to-purple-600" },
  { key: "rose", label: "Rosa", gradient: "from-rose-500 to-pink-600" },
  { key: "amber", label: "Ámbar", gradient: "from-amber-500 to-orange-600" },
  { key: "emerald", label: "Verde", gradient: "from-emerald-500 to-teal-600" },
  { key: "cyan", label: "Cian", gradient: "from-cyan-500 to-sky-600" },
  { key: "slate", label: "Gris", gradient: "from-slate-500 to-slate-700" },
  { key: "red", label: "Rojo", gradient: "from-red-500 to-rose-700" },
];

export const DEFAULT_AVATAR_KEY = "blue";

export function avatarPresetFor(key: string | null | undefined): AvatarPreset {
  return AVATAR_PRESETS.find((p) => p.key === key) ?? AVATAR_PRESETS[0];
}
