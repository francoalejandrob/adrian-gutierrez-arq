"use client";

import { useEffect } from "react";
import { captureAttribution } from "@/lib/utm";

export default function UtmCapture() {
  useEffect(() => {
    captureAttribution();
  }, []);

  return null;
}
