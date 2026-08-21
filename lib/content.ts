export const studio = {
  name: "Adrián Gutiérrez",
  role: "Arquitectura & Diseño",
  location: "Salinas, Ecuador",
  coordinates: "2.21° S / 80.95° W",
  email: "adriangch95@gmail.com",
  instagram: "agutierrez.arq",
  projectCount: 50,
};

export type Project = {
  id: string;
  name: string;
  location: string;
  tagline: string;
  description: string;
  category: "Residencial" | "Remodelación" | "Comercial" | "Institucional" | "Hospitalidad";
  code: string;
  image: string;
  imageAlt: string;
  gallery: { src: string; alt: string }[];
  /** Shown on the homepage grid; all projects appear in the /proyectos archive regardless. */
  featured?: boolean;
};

export const projects: Project[] = [
  {
    id: "municipio-salinas",
    name: "Municipio de Salinas",
    location: "Salinas, Ecuador",
    tagline: "Propuesta urbana institucional con fachadas verdes, torres de uso mixto y espacio público arbolado.",
    description:
      "Propuesta de renovación urbana e institucional para el centro de Salinas: torres de uso mixto con fachadas de jardín vertical, plazas arboladas y estacionamiento organizado en torno a un nuevo espacio público peatonal.",
    category: "Institucional",
    code: "PROY. 01",
    image: "/proyectos/municipio-salinas/1.jpg",
    imageAlt: "Propuesta urbana institucional para Salinas con torres de fachada verde",
    featured: true,
    gallery: [
      { src: "/proyectos/municipio-salinas/1.jpg", alt: "Vista general de la propuesta urbana de Salinas" },
      { src: "/proyectos/municipio-salinas/2.jpg", alt: "Detalle de fachada verde de la propuesta" },
      { src: "/proyectos/municipio-salinas/3.jpg", alt: "Espacio público de la propuesta urbana" },
      { src: "/proyectos/municipio-salinas/4.jpg", alt: "Vista peatonal de la propuesta urbana" },
      { src: "/proyectos/municipio-salinas/5.jpg", alt: "Vista nocturna de la propuesta urbana" },
    ],
  },
  {
    id: "hormipen",
    name: "Hormipen",
    location: "Salinas, Ecuador",
    tagline: "Fachada corporativa en paneles naranja y concreto, con marquesina de acceso e identidad de marca integrada.",
    description:
      "Edificio corporativo resuelto con paneles naranja en fachada, concreto visto e iluminación indirecta que enmarca el acceso principal. El diseño interior incluye recibidor, sala de espera y sala de juntas alineados a la misma identidad de marca.",
    category: "Comercial",
    code: "PROY. 02",
    image: "/proyectos/hormipen/1.jpg",
    imageAlt: "Fachada corporativa de Hormipen en paneles naranja y concreto",
    featured: true,
    gallery: [
      { src: "/proyectos/hormipen/1.jpg", alt: "Fachada de Hormipen al atardecer" },
      { src: "/proyectos/hormipen/2.jpg", alt: "Recibidor de Hormipen" },
      { src: "/proyectos/hormipen/3.jpg", alt: "Sala de juntas de Hormipen" },
      { src: "/proyectos/hormipen/4.jpg", alt: "Sala de espera de Hormipen" },
    ],
  },
  {
    id: "brangus",
    name: "Brangus",
    location: "Salinas, Ecuador",
    tagline: "Restaurante de cortes y vino con muro verde, iluminación cálida y fachada que abre por completo a la vereda.",
    description:
      "Diseño de un restaurante de cortes y vino: estructura de acero y madera, jardín vertical, señalética iluminada e interior cálido con mobiliario en madera natural, pensado para abrirse completamente hacia la calle.",
    category: "Comercial",
    code: "PROY. 03",
    image: "/proyectos/brangus/1.jpg",
    imageAlt: "Fachada de Brangus, restaurante de cortes y vino, al atardecer",
    featured: true,
    gallery: [
      { src: "/proyectos/brangus/1.jpg", alt: "Fachada de Brangus al atardecer" },
      { src: "/proyectos/brangus/2.jpg", alt: "Interior de Brangus" },
      { src: "/proyectos/brangus/3.jpg", alt: "Zona de mesas de Brangus" },
      { src: "/proyectos/brangus/4.jpg", alt: "Detalle de iluminación y muro verde de Brangus" },
    ],
  },
  {
    id: "tulum",
    name: "Tulum",
    location: "Salinas, Ecuador",
    tagline: "Un bistrobar tropical bajo cubierta de palapa, con palmeras, luces cálidas y barra abierta a la terraza.",
    description:
      "Diseño de un restobar de inspiración tropical: estructura de madera y palapa, muro verde, iluminación cálida colgante y una barra que se abre por completo hacia una terraza de tablones al aire libre.",
    category: "Comercial",
    code: "PROY. 04",
    image: "/proyectos/tulum/1.jpg",
    imageAlt: "Terraza de Tulum con palmeras, luces cálidas y mobiliario de madera al atardecer",
    featured: true,
    gallery: [
      { src: "/proyectos/tulum/1.jpg", alt: "Terraza principal de Tulum al atardecer" },
      { src: "/proyectos/tulum/2.jpg", alt: "Interior de Tulum" },
      { src: "/proyectos/tulum/3.jpg", alt: "Barra y zona de estar de Tulum" },
      { src: "/proyectos/tulum/4.jpg", alt: "Detalle de iluminación y estructura de Tulum" },
    ],
  },
  {
    id: "suite-palmar",
    name: "Suite Palmar",
    location: "Palmar, Ecuador",
    tagline: "Dormitorio principal con cielo raso de vigas de madera y una paleta cálida que conecta con baño y terraza.",
    description:
      "Diseño de la suite principal de un proyecto hotelero: cielo raso artesonado en madera, muro ranurado detrás de la cabecera y una distribución abierta que conecta el dormitorio con el baño y una terraza semicubierta.",
    category: "Hospitalidad",
    code: "PROY. 05",
    image: "/proyectos/suite-palmar/1.jpg",
    imageAlt: "Dormitorio principal de Suite Palmar con cielo raso de madera",
    featured: true,
    gallery: [
      { src: "/proyectos/suite-palmar/1.jpg", alt: "Dormitorio principal de Suite Palmar" },
      { src: "/proyectos/suite-palmar/2.jpg", alt: "Vista de Suite Palmar hacia el baño" },
      { src: "/proyectos/suite-palmar/3.jpg", alt: "Detalle de mobiliario de Suite Palmar" },
      { src: "/proyectos/suite-palmar/4.jpg", alt: "Terraza semicubierta de Suite Palmar" },
    ],
  },
  {
    id: "hotel-palmar",
    name: "Hotel Palmar",
    location: "Palmar, Ecuador",
    tagline: "Suites de hotel en clave boho-tropical: maderas cálidas, arcos de piedra texturizada y mobiliario artesanal.",
    description:
      "Propuesta de interiorismo para las suites de un hotel boutique costero, con paleta cálida, arcos revestidos en piedra texturizada, mimbre y madera maciza, y una cocineta integrada al área social.",
    category: "Hospitalidad",
    code: "PROY. 06",
    image: "/proyectos/hotel-palmar/1.jpg",
    imageAlt: "Sala de una suite de Hotel Palmar con arco de piedra texturizada y mobiliario boho",
    gallery: [
      { src: "/proyectos/hotel-palmar/1.jpg", alt: "Sala de estar de una suite de Hotel Palmar" },
      { src: "/proyectos/hotel-palmar/2.jpg", alt: "Cocineta de una suite de Hotel Palmar" },
      { src: "/proyectos/hotel-palmar/3.jpg", alt: "Dormitorio de una suite de Hotel Palmar" },
    ],
  },
  {
    id: "casa-eg",
    name: "Casa EG",
    location: "Salinas, Ecuador",
    tagline: "Fachada minimalista en grafito y piedra, con jardín vertical y acceso vehicular integrado a la calle.",
    description:
      "Una vivienda unifamiliar de líneas limpias y volúmenes en voladizo, resuelta en tonos grafito, piedra apilada y madera. El acceso vehicular, el jardín de estar y la fachada comparten un mismo lenguaje sobrio pensado para la vida diaria de una familia.",
    category: "Residencial",
    code: "PROY. 07",
    image: "/proyectos/casa-eg/1.jpg",
    imageAlt: "Fachada de Casa EG con volúmenes en grafito, muro de piedra y garaje integrado",
    featured: true,
    gallery: [
      { src: "/proyectos/casa-eg/1.jpg", alt: "Fachada frontal de Casa EG al atardecer" },
      { src: "/proyectos/casa-eg/2.jpg", alt: "Área social de Casa EG" },
      { src: "/proyectos/casa-eg/3.jpg", alt: "Área social de Casa EG, otro ángulo" },
      { src: "/proyectos/casa-eg/4.jpg", alt: "Piscina de Casa EG" },
    ],
  },
  {
    id: "suite-js",
    name: "Suite JS",
    location: "Ecuador",
    tagline: "Un apartamento resuelto en madera clara, mármol y acentos verdes, con cocina, sala y dormitorio bajo una misma identidad cálida.",
    description:
      "Interiorismo integral de un apartamento: cocina en tonos claros con isla de mármol, sala-comedor con paneles oscuros y estantería iluminada, y un dormitorio principal con cabecera de madera ranurada y candelabro circular. Un mismo lenguaje cálido recorre los tres ambientes.",
    category: "Residencial",
    code: "PROY. 08",
    image: "/proyectos/suite-js/1.jpg",
    imageAlt: "Sala-comedor de Suite JS con paneles oscuros y estantería iluminada",
    gallery: [
      { src: "/proyectos/suite-js/1.jpg", alt: "Sala-comedor de Suite JS" },
      { src: "/proyectos/suite-js/2.jpg", alt: "Cocina de Suite JS" },
      { src: "/proyectos/suite-js/3.jpg", alt: "Dormitorio de Suite JS" },
    ],
  },
  {
    id: "suite-nueva-york",
    name: "Suite Nueva York",
    location: "Nueva York, Estados Unidos",
    tagline: "Un dormitorio urbano de estética nocturna, con luces de neón, ventanales a la skyline y una identidad marcadamente internacional.",
    description:
      "Propuesta de interiorismo para un dormitorio en altura: iluminación de neón, mobiliario oscuro y ventanales de piso a techo que enmarcan el perfil urbano nocturno. Un ejercicio de diseño pensado para un contexto internacional.",
    category: "Residencial",
    code: "PROY. 09",
    image: "/proyectos/suite-nueva-york/1.jpg",
    imageAlt: "Dormitorio con iluminación de neón y vista a la skyline nocturna de Nueva York",
    gallery: [
      { src: "/proyectos/suite-nueva-york/1.jpg", alt: "Dormitorio de Suite Nueva York con iluminación de neón" },
    ],
  },
  {
    id: "dormitorio-costero",
    name: "Dormitorio Costero",
    location: "Ecuador",
    tagline: "Dormitorio en madera y mimbre con vestidor abierto y vista directa a un jardín tropical.",
    description:
      "Diseño de un dormitorio principal en clave costera: cabecera revestida en madera reticulada, mesas de luz flotantes con iluminación indirecta y un vestidor integrado que se abre al paisaje exterior.",
    category: "Residencial",
    code: "PROY. 10",
    image: "/proyectos/dormitorio-costero/1.jpg",
    imageAlt: "Dormitorio costero con cabecera de madera reticulada y vestidor abierto",
    gallery: [
      { src: "/proyectos/dormitorio-costero/1.jpg", alt: "Dormitorio Costero" },
    ],
  },
  {
    id: "bano-spa",
    name: "Baño Spa",
    location: "Ecuador",
    tagline: "Baño principal en piedra oscura y madera, con tina exenta y ducha abierta en clave de spa.",
    description:
      "Interiorismo de un baño principal resuelto en piedra oscura, madera clara y luz cálida indirecta, con tina exenta y ducha abierta que evocan la experiencia de un spa privado.",
    category: "Residencial",
    code: "PROY. 11",
    image: "/proyectos/bano-spa/1.jpg",
    imageAlt: "Baño principal en piedra oscura y madera con tina exenta",
    gallery: [{ src: "/proyectos/bano-spa/1.jpg", alt: "Baño Spa" }],
  },
  {
    id: "bano-esmeralda",
    name: "Baño Esmeralda",
    location: "Ecuador",
    tagline: "Tocador en mosaico esmeralda y grifería dorada, con mármol veteado y espejo ovalado retroiluminado.",
    description:
      "Diseño de un baño social con mosaico geométrico en tonos esmeralda, mármol veteado y grifería dorada, resuelto como una pieza de carácter dentro de la vivienda.",
    category: "Residencial",
    code: "PROY. 12",
    image: "/proyectos/bano-esmeralda/1.jpg",
    imageAlt: "Baño con mosaico esmeralda, mármol veteado y grifería dorada",
    gallery: [{ src: "/proyectos/bano-esmeralda/1.jpg", alt: "Baño Esmeralda" }],
  },
  {
    id: "cocina-urbana",
    name: "Cocina Urbana",
    location: "Ecuador",
    tagline: "Cocina abierta al comedor, en tonos grises y acentos verde oliva, bajo una lámpara escultórica.",
    description:
      "Cocina integrada al comedor con isla en gris claro, mobiliario tapizado en verde oliva y una lámpara colgante escultórica como punto focal del espacio.",
    category: "Residencial",
    code: "PROY. 13",
    image: "/proyectos/cocina-urbana/1.jpg",
    imageAlt: "Cocina y comedor en tonos grises con acentos verde oliva",
    gallery: [{ src: "/proyectos/cocina-urbana/1.jpg", alt: "Cocina Urbana" }],
  },
  {
    id: "cocina-nocturna",
    name: "Cocina Nocturna",
    location: "Ecuador",
    tagline: "Cocina en tonos negros y madera, integrada a una sala de estar con muro de concreto visto.",
    description:
      "Cocina de gabinetes en negro mate con isla de madera y mesa de comedor integrada, resuelta junto a una sala con muro de concreto visto y televisor empotrado.",
    category: "Residencial",
    code: "PROY. 14",
    image: "/proyectos/cocina-nocturna/1.jpg",
    imageAlt: "Cocina en negro mate y madera junto a una sala con muro de concreto visto",
    gallery: [{ src: "/proyectos/cocina-nocturna/1.jpg", alt: "Cocina Nocturna" }],
  },
  {
    id: "living-abierto",
    name: "Living Abierto",
    location: "Ecuador",
    tagline: "Sala de estar abierta a la cocina, en madera clara, negro mate y un sofá verde salvia.",
    description:
      "Espacio social integrado: sala con sofá verde salvia y mesas auxiliares en metal, cocina en madera clara y negro mate, y un muro de estanterías que ordena el ambiente sin cerrarlo.",
    category: "Residencial",
    code: "PROY. 15",
    image: "/proyectos/living-abierto/1.jpg",
    imageAlt: "Sala de estar con sofá verde salvia abierta a la cocina",
    gallery: [{ src: "/proyectos/living-abierto/1.jpg", alt: "Living Abierto" }],
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
  title: string;
  description: string;
};

export const process: ProcessStep[] = [
  {
    title: "Conceptualiza",
    description: "Diseñando contigo para crear proyectos extraordinarios.",
  },
  {
    title: "Construye",
    description: "Edificando de manera eficaz, honesta y directa en comunicación continua.",
  },
  {
    title: "Consolida",
    description: "Comprometidos con tu patrimonio y creciendo juntos.",
  },
];

export const architectBio = {
  quote:
    "La buena arquitectura no se define únicamente por lo que vemos, sino por la manera en que transforma la experiencia de quienes la habitan.",
  bio: [
    "Adrián Gutiérrez es arquitecto y diseñador, con experiencia en el desarrollo de proyectos de diversas escalas y tipologías. Durante los últimos años ha desarrollado proyectos de arquitectura, diseño y remodelación en la costa ecuatoriana, explorando una arquitectura sensible al contexto, al entorno y a las necesidades particulares de cada proyecto.",
    "Su trabajo parte de una convicción: la arquitectura debe responder al lugar, al clima, a la luz y a la manera en que las personas viven y experimentan los espacios. Desde esta perspectiva, cada proyecto busca establecer un equilibrio entre funcionalidad, identidad y expresión estética, creando espacios con carácter, propósito y una visión pensada para trascender.",
  ],
};

export const contactNeeds = [
  "Nueva construcción",
  "Remodelación",
  "Consultoría",
] as const;
