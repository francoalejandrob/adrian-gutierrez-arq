import { initials } from "@/lib/format";

// Circular initials chip — the reference dashboard uses photo avatars,
// but there are no client/user photos in this app, so initials is the
// honest equivalent (reused from the sidebar's user chip, which now
// renders through this same component instead of its own one-off span).
// Color is deterministic per name (a hash into the palette), not random,
// so the same person always gets the same color across the app.
const PALETTE = ["bg-tinta", "bg-verde", "bg-azul", "bg-ambar", "bg-acento", "bg-grafito"];

function colorFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export default function Avatar({ name, size = 26 }: { name: string; size?: number }) {
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
