"use client";

import { useState } from "react";
import { Download } from "lucide-react";

export default function DownloadButton({
  storagePath,
  getUrl,
}: {
  storagePath: string;
  getUrl: (storagePath: string) => Promise<string>;
}) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const url = await getUrl(storagePath);
      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="flex cursor-pointer items-center gap-1.5 font-dp-mono text-[10.5px] uppercase tracking-[0.08em] text-concreto transition-colors duration-150 hover:text-tinta disabled:cursor-wait"
    >
      <Download size={13} strokeWidth={1.75} aria-hidden="true" />
      {loading ? "Generando…" : "Descargar"}
    </button>
  );
}
