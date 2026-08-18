export const studio = {
  name: "Adrián Gutiérrez",
  role: "Arquitectura & Diseño",
  location: "Salinas, Ecuador",
  coordinates: "2.21° S / 80.95° W",
  email: "adriangch95@gmail.com",
  years: 5,
  projectCount: 20,
};

export type Project = {
  id: string;
  name: string;
  location: string;
  tagline: string;
  category: "Residencial" | "Remodelación";
  code: string;
  image: string;
  imageAlt: string;
};

export const projects: Project[] = [
  {
    id: "casa-aire",
    name: "Casa Aire",
    location: "Salinas, Ecuador",
    tagline: "Volúmenes blancos y vidrio corredizo alrededor de una piscina que organiza la vida social de la casa.",
    category: "Residencial",
    code: "PROY. 01",
    image: "/proyectos/casa-aire.jpg",
    imageAlt: "Fachada posterior de Casa Aire con piscina, terraza y grandes ventanales corredizos",
  },
  {
    id: "villa-atardecer",
    name: "Villa Atardecer",
    location: "Manglaralto, Ecuador",
    tagline: "Piedra local y madera en una casa de descanso pensada para ver caer el sol sobre la piscina.",
    category: "Residencial",
    code: "PROY. 02",
    image: "/proyectos/villa-atardecer.jpg",
    imageAlt: "Villa de piedra con piscina y vegetación tropical al atardecer",
  },
  {
    id: "casa-embalse",
    name: "Casa del Embalse",
    location: "Chongón, Ecuador",
    tagline: "Una casa de retiro familiar frente al agua, rodeada de vegetación nativa y silencio.",
    category: "Residencial",
    code: "PROY. 03",
    image: "/proyectos/casa-embalse.jpg",
    imageAlt: "Casa de techo de teja frente a un embalse, rodeada de árboles",
  },
  {
    id: "residencia-norte",
    name: "Residencia Norte",
    location: "Guayaquil, Ecuador",
    tagline: "Reordenamiento de fachada y accesos para una vivienda familiar en una urbanización cerrada.",
    category: "Remodelación",
    code: "PROY. 04",
    image: "/proyectos/residencia-norte.jpg",
    imageAlt: "Fachada contemporánea de Residencia Norte con acceso vehicular y balcón",
  },
];

export type PhilosophyItem = {
  word: string;
  description: string;
};

export const philosophy: PhilosophyItem[] = [
  {
    word: "Luz",
    description: "Cada planta se orienta primero a la trayectoria del sol, no al plano catastral.",
  },
  {
    word: "Materiales",
    description: "Piedra, madera y concreto visto, elegidos por cómo envejecen y no solo por cómo lucen el día de la entrega.",
  },
  {
    word: "Naturaleza",
    description: "El viento, la arena y el horizonte del Pacífico son parte del programa arquitectónico, no un fondo.",
  },
  {
    word: "Sostenibilidad",
    description: "Ventilación cruzada, sombra pasiva y sistemas de bajo consumo antes que soluciones mecánicas.",
  },
];

export type ProcessStep = {
  phase: string;
  title: string;
  description: string;
};

export const process: ProcessStep[] = [
  {
    phase: "FASE 01",
    title: "Consulta",
    description: "Escuchamos el terreno, el presupuesto y la forma de vida de quienes habitarán el proyecto.",
  },
  {
    phase: "FASE 02",
    title: "Diseño",
    description: "Anteproyecto, planos definitivos y una maqueta clara de cómo se va a vivir cada espacio.",
  },
  {
    phase: "FASE 03",
    title: "Obra",
    description: "Supervisión directa en sitio para que lo construido sea fiel a lo diseñado, sin sorpresas.",
  },
  {
    phase: "FASE 04",
    title: "Entrega",
    description: "Recorrido final, cierre de detalles y acompañamiento durante los primeros meses de uso.",
  },
];

export const architectBio = {
  quote:
    "Una buena casa no se nota en la fachada, se nota en cómo cambia el día a día de quien la habita.",
  bio: "Arquitecto formado en el diseño de vivienda costera, Adrián Gutiérrez ha dedicado los últimos cinco años a proyectos residenciales y remodelaciones en la península de Santa Elena. Su trabajo parte de una idea simple: cada casa debe responder primero al clima, la luz y quienes la habitan, y solo después a la estética.",
};

export const contactNeeds = [
  "Nueva construcción",
  "Remodelación",
  "Consultoría",
] as const;
