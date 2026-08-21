import Hero from "@/components/hero";
import Intro from "@/components/intro";
import ProyectosGrid from "@/components/proyectos-grid";
import SobreEstudio from "@/components/sobre-estudio";
import ContactoCta from "@/components/contacto-cta";
import InstagramFeed from "@/components/instagram-feed";
import Proceso from "@/components/proceso";
import Contacto from "@/components/contacto";
import { getInstagramPosts } from "@/lib/instagram";

export default async function Home() {
  const instagramPosts = await getInstagramPosts();

  return (
    <>
      <Hero />
      <Intro />
      <ProyectosGrid />
      <SobreEstudio />
      <ContactoCta />
      <InstagramFeed posts={instagramPosts} />
      <Proceso />
      <Contacto />
    </>
  );
}
