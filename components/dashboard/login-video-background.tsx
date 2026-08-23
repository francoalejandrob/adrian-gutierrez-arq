// Fondo de video compartido entre /login (admin) y /portal/login
// (cliente) — mismo panel izquierdo en los dos, así que vive en un
// solo lugar. No necesita "use client": un <video> autoplay/muted es
// HTML plano, no hace falta interactividad de React para que funcione.
// Se apoya en .dp-grain-strong como base (se ve mientras el video
// carga) más un overlay oscuro (bg-papel, el tono casi-negro del pase
// oscuro) para que el texto arriba siga siendo legible.
export default function LoginVideoBackground() {
  return (
    <>
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/videos/login-background-poster.jpg"
      >
        <source src="/videos/login-background.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-papel/55" aria-hidden="true" />
    </>
  );
}
