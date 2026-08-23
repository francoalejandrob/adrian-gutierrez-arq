import { Rethink_Sans } from "next/font/google";

// The dashboard/portal's own type system — pedido explícito del
// usuario: una sola tipografía, Rethink Sans, para todo (antes:
// Instrument Serif para títulos, Archivo para texto, JetBrains Mono
// para cifras/etiquetas). Se cargan todos los pesos que el sistema ya
// usaba en distintos roles (400-800) más itálica, porque dos lugares
// del código ponen font-dp-serif en cursiva. Loaded separately from the
// public site's fonts (Fraunces/IBM Plex, set up in the root
// app/layout.tsx) so the two brand systems never collide; combine the
// `.variable` class name onto the outer wrapper of every
// dashboard/portal entry point (both authenticated layouts, both login
// pages) to make `--font-dp-serif/dp-sans/dp-mono` resolve — los tres
// alias apuntan ahora a esta única fuente (ver app/globals.css).

const rethinkSans = Rethink_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-rethink-sans",
  display: "swap",
});

export const dpFontVars = rethinkSans.variable;
