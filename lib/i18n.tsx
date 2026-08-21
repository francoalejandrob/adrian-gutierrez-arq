"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Project } from "@/lib/content";

export type Locale = "es" | "en";

const LocaleContext = createContext<{
  locale: Locale;
  toggle: () => void;
}>({
  locale: "es",
  toggle: () => {},
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("es");

  useEffect(() => {
    const stored = window.localStorage.getItem("locale");
    if (stored === "en" || stored === "es") setLocale(stored);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("locale", locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo(
    () => ({
      locale,
      toggle: () => setLocale((l) => (l === "es" ? "en" : "es")),
    }),
    [locale],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}

export const dict = {
  es: {
    nav: {
      proyectos: "Proyectos",
      estudio: "Estudio",
      proceso: "Proceso",
      contacto: "Contacto",
    },
    hero: {
      line1: "Diseñamos y construimos",
      line2: "proyectos que buscan",
      line3: "trascender.",
      subtext:
        "Arquitectura, diseño y construcción concebidos para crear espacios con identidad, propósito y permanencia.",
    },
    intro: {
      headingBefore: "Cada proyecto empieza por entender cómo entra el sol, de dónde viene el viento y cómo se va a ",
      headingBold: "vivir el espacio",
      headingAfter: ", mucho antes de dibujar una fachada.",
      statProjects: "Proyectos entregados en Ecuador y Estados Unidos",
      statSupervision: "Supervisión directa en obra",
    },
    proceso: {
      eyebrow: "AG Arquitectura",
      heading: "De la conceptualización a la consolidación de tu patrimonio.",
    },
    sobreEstudio: {
      role: "Arquitectura & Diseño",
      detailStrip: [
        "Boceto inicial",
        "Materiales",
        "Luz natural",
        "Obra en sitio",
      ],
    },
    proyectosGrid: {
      heading: "Proyectos",
      subheading: "Conoce nuestro trabajo.",
      cta: "Ver todos nuestros proyectos",
    },
    proyectosArchivo: {
      todos: "Todos",
    },
    proyectosPage: {
      eyebrow: "Archivo",
      heading: "Todos los proyectos",
      subheading: "Arquitectura, diseño y construcción en Ecuador y Estados Unidos.",
      cta: "Conversemos sobre tu proyecto",
    },
    proyectoDetalle: {
      back: "Archivo de proyectos",
      ctaContact: "Conversemos sobre tu proyecto",
      ctaAll: "Ver todos los proyectos",
    },
    contacto: {
      heading: "Conversemos sobre tu próximo proyecto, esté donde esté.",
      subheading:
        "Trabajamos en Ecuador, Estados Unidos y con clientes en cualquier parte del mundo. Cuéntanos qué necesitas y te contactaremos para agendar una primera conversación.",
    },
    contactoCta: {
      cta: "Solicitar información",
    },
    contactoForm: {
      name: "Nombre",
      email: "Email",
      phone: "Teléfono",
      location: "Ciudad y país del proyecto",
      locationPlaceholder: "Ej. Miami, Estados Unidos",
      need: "¿Qué necesitas?",
      needPlaceholder: "Selecciona una opción",
      message: "Mensaje",
      send: "Enviar mensaje",
      sending: "Enviando…",
      successTitle: "Mensaje enviado.",
      successBody:
        "Gracias por escribir. Te contactaremos en las próximas 24-48 horas hábiles.",
      genericError: "No se pudo enviar el mensaje. Intenta de nuevo.",
      needOptions: {
        "Nueva construcción": "Nueva construcción",
        "Remodelación": "Remodelación",
        "Consultoría": "Consultoría",
      } as Record<string, string>,
    },
    instagram: {
      follow: "Seguir en Instagram",
    },
    footer: {
      tagline: "Arquitectura, diseño y construcción de proyectos en Ecuador, Estados Unidos y el resto del mundo.",
      rights: "Todos los derechos reservados.",
    },
    categories: {
      Residencial: "Residencial",
      Remodelación: "Remodelación",
      Comercial: "Comercial",
      Institucional: "Institucional",
      Hospitalidad: "Hospitalidad",
    } as Record<Project["category"], string>,
  },
  en: {
    nav: {
      proyectos: "Projects",
      estudio: "Studio",
      proceso: "Process",
      contacto: "Contact",
    },
    hero: {
      line1: "We design and build",
      line2: "projects that seek",
      line3: "to transcend.",
      subtext:
        "Architecture, design, and construction conceived to create spaces with identity, purpose, and permanence.",
    },
    intro: {
      headingBefore: "Every project starts by understanding where the sun comes from, which way the wind blows, and how the space will be ",
      headingBold: "lived in",
      headingAfter: ", long before a façade is drawn.",
      statProjects: "Projects delivered in Ecuador and the United States",
      statSupervision: "Direct on-site supervision",
    },
    proceso: {
      eyebrow: "AG Architecture",
      heading: "From conceptualization to consolidating your legacy.",
    },
    sobreEstudio: {
      role: "Architecture & Design",
      detailStrip: [
        "Initial sketch",
        "Materials",
        "Natural light",
        "On-site construction",
      ],
    },
    proyectosGrid: {
      heading: "Projects",
      subheading: "Get to know our work.",
      cta: "View all our projects",
    },
    proyectosArchivo: {
      todos: "All",
    },
    proyectosPage: {
      eyebrow: "Archive",
      heading: "All projects",
      subheading: "Architecture, design, and construction in Ecuador and the United States.",
      cta: "Let's talk about your project",
    },
    proyectoDetalle: {
      back: "Projects archive",
      ctaContact: "Let's talk about your project",
      ctaAll: "View all projects",
    },
    contacto: {
      heading: "Let's talk about your next project, wherever it is.",
      subheading:
        "We work in Ecuador, the United States, and with clients anywhere in the world. Tell us what you need and we'll reach out to schedule an initial conversation.",
    },
    contactoCta: {
      cta: "Request information",
    },
    contactoForm: {
      name: "Name",
      email: "Email",
      phone: "Phone",
      location: "Project city & country",
      locationPlaceholder: "E.g. Miami, United States",
      need: "What do you need?",
      needPlaceholder: "Select an option",
      message: "Message",
      send: "Send message",
      sending: "Sending…",
      successTitle: "Message sent.",
      successBody: "Thanks for writing. We'll reach out within the next 24-48 business hours.",
      genericError: "Couldn't send the message. Please try again.",
      needOptions: {
        "Nueva construcción": "New construction",
        "Remodelación": "Renovation",
        "Consultoría": "Consulting",
      } as Record<string, string>,
    },
    instagram: {
      follow: "Follow on Instagram",
    },
    footer: {
      tagline: "Architecture, design, and construction of projects in Ecuador, the United States, and worldwide.",
      rights: "All rights reserved.",
    },
    categories: {
      Residencial: "Residential",
      Remodelación: "Renovation",
      Comercial: "Commercial",
      Institucional: "Institutional",
      Hospitalidad: "Hospitality",
    } as Record<Project["category"], string>,
  },
} as const;

export function useT() {
  const { locale } = useLocale();
  return dict[locale];
}

/** English overrides for project copy; Spanish comes straight from lib/content.ts. */
export const projectI18n: Record<string, { tagline: string; description: string }> = {
  "municipio-salinas": {
    tagline:
      "An institutional urban proposal with green façades, mixed-use towers, and tree-lined public space.",
    description:
      "An urban and institutional renewal proposal for downtown Salinas: mixed-use towers with vertical-garden façades, tree-lined plazas, and parking organized around a new pedestrian public space.",
  },
  hormipen: {
    tagline:
      "A corporate façade in orange panels and concrete, with a lit entrance canopy and integrated brand identity.",
    description:
      "A corporate building resolved with orange façade panels, exposed concrete, and indirect lighting that frames the main entrance. The interior design includes a reception, waiting room, and boardroom aligned with the same brand identity.",
  },
  brangus: {
    tagline:
      "A steak and wine restaurant with a living wall, warm lighting, and a façade that opens fully onto the sidewalk.",
    description:
      "Design for a steak and wine restaurant: a steel and wood structure, a vertical garden, lit signage, and a warm interior with natural-wood furniture, designed to open completely onto the street.",
  },
  tulum: {
    tagline:
      "A tropical bistro-bar under a palapa roof, with palm trees, warm lights, and a bar that opens onto the terrace.",
    description:
      "Design for a tropical-inspired bistro-bar: a wood and palapa structure, a living wall, warm hanging lighting, and a bar that opens completely onto an open-air wood-deck terrace.",
  },
  "suite-palmar": {
    tagline:
      "A primary bedroom with a wood-beamed ceiling and a warm palette that connects to the bathroom and terrace.",
    description:
      "Design for the primary suite of a hospitality project: a wood coffered ceiling, a slatted wall behind the headboard, and an open layout connecting the bedroom to the bathroom and a semi-covered terrace.",
  },
  "hotel-palmar": {
    tagline:
      "Boho-tropical hotel suites: warm woods, textured stone arches, and handcrafted furniture.",
    description:
      "An interior design proposal for the suites of a boutique coastal hotel, with a warm palette, textured-stone-clad arches, wicker and solid wood, and a kitchenette integrated into the living area.",
  },
  "casa-eg": {
    tagline:
      "A minimalist façade in graphite and stone, with a vertical garden and vehicle access built into the street.",
    description:
      "A single-family home of clean lines and cantilevered volumes, resolved in graphite tones, stacked stone, and wood. The vehicle access, the garden seating area, and the façade share the same sober language, designed for a family's everyday life.",
  },
  "suite-js": {
    tagline:
      "An apartment resolved in light wood, marble, and green accents, with kitchen, living room, and bedroom sharing one warm identity.",
    description:
      "Full interior design for an apartment: a kitchen in light tones with a marble island, a living-dining room with dark panels and a lit bookshelf, and a primary bedroom with a slatted-wood headboard and a circular chandelier. The same warm language runs through all three spaces.",
  },
  "suite-nueva-york": {
    tagline:
      "An urban bedroom with a nighttime aesthetic, neon lighting, skyline windows, and a distinctly international identity.",
    description:
      "An interior design proposal for a high-rise bedroom: neon lighting, dark furniture, and floor-to-ceiling windows framing the nighttime city skyline. A design exercise conceived for an international context.",
  },
  "dormitorio-costero": {
    tagline:
      "A bedroom in wood and wicker with an open closet and a direct view of a tropical garden.",
    description:
      "Design for a primary bedroom in a coastal key: a headboard clad in latticed wood, floating nightstands with indirect lighting, and an integrated closet that opens onto the landscape outside.",
  },
  "bano-spa": {
    tagline:
      "A primary bathroom in dark stone and wood, with a freestanding tub and an open shower in a spa key.",
    description:
      "Interior design for a primary bathroom resolved in dark stone, light wood, and warm indirect light, with a freestanding tub and open shower evoking a private spa experience.",
  },
  "bano-esmeralda": {
    tagline:
      "A powder room in emerald mosaic and gold fixtures, with veined marble and a backlit oval mirror.",
    description:
      "Design for a powder room with geometric mosaic in emerald tones, veined marble, and gold fixtures, resolved as a statement piece within the home.",
  },
  "cocina-urbana": {
    tagline:
      "A kitchen open to the dining room, in gray tones with olive-green accents, under a sculptural pendant lamp.",
    description:
      "A kitchen integrated with the dining room, with a light-gray island, olive-green upholstered furniture, and a sculptural pendant lamp as the space's focal point.",
  },
  "cocina-nocturna": {
    tagline:
      "A kitchen in black tones and wood, integrated with a living room featuring an exposed-concrete wall.",
    description:
      "A kitchen with matte-black cabinetry, a wood island, and an integrated dining table, resolved alongside a living room with an exposed-concrete wall and a built-in TV.",
  },
  "living-abierto": {
    tagline:
      "A living room open to the kitchen, in light wood, matte black, and a sage-green sofa.",
    description:
      "An integrated social space: a living room with a sage-green sofa and metal side tables, a kitchen in light wood and matte black, and a shelving wall that organizes the space without closing it off.",
  },
};

export function translateProject(project: Project, locale: Locale) {
  if (locale === "es") {
    return { tagline: project.tagline, description: project.description };
  }
  return projectI18n[project.id] ?? {
    tagline: project.tagline,
    description: project.description,
  };
}

export function translateLocation(location: string, locale: Locale) {
  if (locale === "es") return location;
  return location
    .replace("Estados Unidos", "United States")
    .replace("Nueva York", "New York");
}

export const architectBioEn = {
  quote:
    "Good architecture isn't defined solely by what we see, but by the way it transforms the experience of those who inhabit it.",
  bio: [
    "Adrián Gutiérrez is an architect and designer with experience developing projects of varying scale and typology. In recent years he has developed architecture, design, and renovation projects along the Ecuadorian coast, exploring an architecture sensitive to context, environment, and the particular needs of each project.",
    "His work starts from one conviction: architecture must respond to place, climate, light, and the way people live in and experience spaces. From this perspective, every project seeks a balance between functionality, identity, and aesthetic expression, creating spaces with character, purpose, and a vision built to last. Today that work crosses borders: alongside Ecuador, the studio develops projects in the United States and is open to international commissions.",
  ],
};

export const processEn = [
  { title: "Conceptualize", description: "Designing with you to create extraordinary projects." },
  { title: "Build", description: "Building efficiently, honestly, and with direct, ongoing communication." },
  { title: "Consolidate", description: "Committed to your legacy, growing together." },
];
