import Hero from "@/components/hero";
import Marquee from "@/components/marquee";
import Intro from "@/components/intro";
import ProyectosGrid from "@/components/proyectos-grid";
import InstagramFeed from "@/components/instagram-feed";
import Filosofia from "@/components/filosofia";
import SobreEstudio from "@/components/sobre-estudio";
import Proceso from "@/components/proceso";
import Contacto from "@/components/contacto";

const TICKER_ITEMS = [
  "Arquitectura residencial de lujo",
  "Diseño a medida",
  "Salinas, Ecuador",
  "Remodelaciones",
  "Luz · Materiales · Naturaleza",
];

export default function Home() {
  return (
    <>
      <Hero />
      <Marquee items={TICKER_ITEMS} />
      <Intro />
      <ProyectosGrid />
      <InstagramFeed />
      <Filosofia />
      <SobreEstudio />
      <Proceso />
      <Contacto />
    </>
  );
}
