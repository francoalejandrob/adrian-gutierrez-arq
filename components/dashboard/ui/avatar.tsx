import { initials } from "@/lib/format";

// Circular initials chip — falls back to this when there's no real
// photo. Since Fase "settings editable" (avatar_url en profiles, bucket
// publico "avatars"), quien subió una foto real la ve acá en vez de
// iniciales; quien no, sigue viendo el chip determinístico de siempre —
// nunca una foto genérica ni un ícono de persona placeholder.
// Color is deterministic per name (a hash into the palette), not random,
// so the same person always gets the same color across the app.
const PALETTE = ["bg-tinta", "bg-verde", "bg-azul", "bg-ambar", "bg-acento", "bg-grafito"];

function colorFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export default function Avatar({ name, size = 26, src }: { name: string; size?: number; src?: string | null }) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- URL pública dinámica (Supabase Storage), sin next.config remotePatterns todavía.
      <img
        src={src}
        alt={name}
        title={name}
        className="inline-block shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-dp-mono text-papel ${colorFor(name)}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
      title={name}
    >
      {initials(name)}
    </span>
  );
}
