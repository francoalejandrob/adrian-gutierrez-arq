import { Archivo, Instrument_Serif, JetBrains_Mono } from "next/font/google";

// The dashboard/portal's own type system (DISEÑO PROFESIONAL/ARCHI.OS
// v2.dc.html) — Instrument Serif for display headlines, Archivo for
// interface text, JetBrains Mono for figures/labels/metadata. Loaded
// separately from the public site's fonts (Fraunces/IBM Plex, set up in
// the root app/layout.tsx) so the two brand systems never collide;
// combine the three `.variable` class names onto the outer wrapper of
// every dashboard/portal entry point (both authenticated layouts, both
// login pages) to make `--font-dp-serif/dp-sans/dp-mono` resolve.

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-archivo",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const dpFontVars = `${instrumentSerif.variable} ${archivo.variable} ${jetbrainsMono.variable}`;
