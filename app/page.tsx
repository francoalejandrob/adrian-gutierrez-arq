import Hero from "@/components/hero";
import Intro from "@/components/intro";
import ProyectosGrid from "@/components/proyectos-grid";
import SobreEstudio from "@/components/sobre-estudio";
import InstagramFeed from "@/components/instagram-feed";
import Filosofia from "@/components/filosofia";
import Proceso from "@/components/proceso";
import Contacto from "@/components/contacto";

export default function Home() {
  return (
    <>
      <Hero />
      <Intro />
      <ProyectosGrid />
      <SobreEstudio />
      <InstagramFeed />
      <Filosofia />
      <Proceso />
      <Contacto />
    </>
  );
}
