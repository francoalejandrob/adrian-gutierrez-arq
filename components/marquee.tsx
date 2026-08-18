export default function Marquee({ items }: { items: string[] }) {
  const content = items.join("   /   ");

  return (
    <div className="overflow-hidden border-y border-carbon/10 bg-hueso py-5">
      <div className="flex w-max animate-marquee gap-0 will-change-transform">
        {[0, 1].map((copy) => (
          <span
            key={copy}
            aria-hidden={copy === 1}
            className="whitespace-nowrap pr-8 font-mono text-sm uppercase tracking-[0.2em] text-piedra"
          >
            {content}
            {"   /   "}
          </span>
        ))}
      </div>
    </div>
  );
}
