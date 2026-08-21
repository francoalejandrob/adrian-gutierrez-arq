"use client";

import { useState } from "react";
import { getSignedDownloadUrl } from "@/app/(dashboard)/dashboard/projects/[id]/actions";

export default function DownloadButton({ storagePath }: { storagePath: string }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const url = await getSignedDownloadUrl(storagePath);
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
      className="cursor-pointer text-carbon/60 underline underline-offset-2 hover:text-carbon disabled:cursor-wait"
    >
      {loading ? "Generando…" : "Descargar"}
    </button>
  );
}
