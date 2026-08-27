import Hero from "@/components/hero";
import Intro from "@/components/intro";
import ProyectosGrid from "@/components/proyectos-grid";
import SobreEstudio from "@/components/sobre-estudio";
import ContactoCta from "@/components/contacto-cta";
import InstagramFeed from "@/components/instagram-feed";
import Proceso from "@/components/proceso";
import Contacto from "@/components/contacto";
import { getInstagramPosts } from "@/lib/instagram";
import { getWebsiteContent } from "@/lib/website-content";

export default async function Home() {
  const [instagramPosts, websiteContent] = await Promise.all([getInstagramPosts(), getWebsiteContent()]);

  return (
    <>
      <Hero content={websiteContent.hero} />
      <Intro />
      <ProyectosGrid projects={websiteContent.projects} />
      <SobreEstudio content={websiteContent.about} />
      <ContactoCta />
      <InstagramFeed posts={instagramPosts} />
      <Proceso />
      <Contacto />
    </>
  );
}
