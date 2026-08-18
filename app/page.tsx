import Hero from "@/components/hero";
import Intro from "@/components/intro";
import ProyectosGrid from "@/components/proyectos-grid";
import Filosofia from "@/components/filosofia";
import SobreEstudio from "@/components/sobre-estudio";
import Proceso from "@/components/proceso";
import Contacto from "@/components/contacto";

export default function Home() {
  return (
    <>
      <Hero />
      <Intro />
      <ProyectosGrid />
      <Filosofia />
      <SobreEstudio />
      <Proceso />
      <Contacto />
    </>
  );
}
