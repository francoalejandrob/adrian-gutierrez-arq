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
  art: "casa-malecon" | "villa-punta-carnero" | "residencia-chipipe" | "casa-libertador";
};

export const projects: Project[] = [
  {
    id: "casa-malecon",
    name: "Casa Malecón",
    location: "Salinas, Ecuador",
    tagline: "Vivienda de playa de líneas limpias, abierta por completo al horizonte del Pacífico.",
    category: "Residencial",
    code: "PROY. 01",
    art: "casa-malecon",
  },
  {
    id: "villa-punta-carnero",
    name: "Villa Punta Carnero",
    location: "Punta Carnero, Ecuador",
    tagline: "Volúmenes escalonados sobre el acantilado, en diálogo constante con el viento y la luz.",
    category: "Residencial",
    code: "PROY. 02",
    art: "villa-punta-carnero",
  },
  {
    id: "residencia-chipipe",
    name: "Residencia Chipipe",
    location: "Salinas, Ecuador",
    tagline: "Remodelación integral de una vivienda de los años 90 hacia un lenguaje cálido y minimal.",
    category: "Remodelación",
    code: "PROY. 03",
    art: "residencia-chipipe",
  },
  {
    id: "casa-libertador",
    name: "Casa Libertador",
    location: "Guayaquil, Ecuador",
    tagline: "Ampliación y reordenamiento de una casa urbana en torno a un patio central de luz.",
    category: "Remodelación",
    code: "PROY. 04",
    art: "casa-libertador",
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
