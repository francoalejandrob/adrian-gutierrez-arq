"use client";

import { useState } from "react";

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
      className="cursor-pointer font-dp-mono text-[10.5px] uppercase tracking-[0.08em] text-concreto underline underline-offset-2 hover:text-tinta disabled:cursor-wait"
    >
      {loading ? "Generando…" : "Descargar"}
    </button>
  );
}
