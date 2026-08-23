"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

// Primer uso de next/script en el proyecto — carga la Maps JavaScript
// API bajo demanda (Fase 7, mapa de clientes/proyectos). Usa
// google.maps.Marker clásico (no AdvancedMarkerElement) para no
// depender de un mapId adicional — suficiente para pines simples con
// InfoWindow.

export type MapPinData = {
  id: string;
  name: string;
  kind: "client" | "project";
  lat: number;
  lng: number;
  href: string;
};

declare global {
  interface Window {
    google?: typeof google;
  }
}

const DEFAULT_CENTER = { lat: -2.1709979, lng: -79.9223592 };

export default function MapView({ pins, apiKey }: { pins: MapPinData[]; apiKey: string }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!loaded || !mapRef.current || !window.google) return;

    const google = window.google;
    const map = new google.maps.Map(mapRef.current, {
      center: pins[0] ? { lat: pins[0].lat, lng: pins[0].lng } : DEFAULT_CENTER,
      zoom: pins.length ? 12 : 6,
    });

    if (pins.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    const infoWindow = new google.maps.InfoWindow();

    for (const pin of pins) {
      const color = pin.kind === "project" ? "#3f6b52" : "#47607a";
      const position = { lat: pin.lat, lng: pin.lng };
      const marker = new google.maps.Marker({
        position,
        map,
        title: pin.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: "#f7f5ef",
          strokeWeight: 2,
          scale: 8,
        },
      });
      marker.addListener("click", () => {
        infoWindow.setContent(
          `<div style="font-family:Archivo,sans-serif;font-size:13px;line-height:1.5;">` +
            `<strong>${escapeHtml(pin.name)}</strong><br/>` +
            `<a href="${pin.href}" style="color:#47607a;">Ver ficha →</a></div>`,
        );
        infoWindow.open(map, marker);
      });
      bounds.extend(position);
    }

    if (pins.length > 1) map.fitBounds(bounds);
  }, [loaded, pins]);

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}`}
        strategy="afterInteractive"
        onLoad={() => setLoaded(true)}
      />
      <div ref={mapRef} className="h-[560px] w-full rounded-2xl border border-filete" />
    </>
  );
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
}
