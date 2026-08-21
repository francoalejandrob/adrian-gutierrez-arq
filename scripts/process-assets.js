/* eslint-disable @typescript-eslint/no-require-imports -- plain CJS Node script */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");

const PROJECTS = [
  {
    slug: "casa-eg",
    dir: "CASA EG",
    files: [
      "FACHADA CASA EG.png",
      "AREA SOCIAL CASA EG.png",
      "AREA SOCIAL CASA EG 2.png",
      "PISCINA CASA EG.png",
    ],
  },
  {
    slug: "tulum",
    dir: "TULUM",
    files: ["TULUM 1.png", "TULUM 2.png", "TULUM 3.png", "TULUM 4.png"],
  },
  {
    slug: "hormipen",
    dir: "HORMIPEN",
    files: [
      "HORMIPEN FACHADA.png",
      "RECIBIDOR HORMIPEN 1.png",
      "RENDER SALA DE JUNTAS HORMIPEN.png",
      "SALA DE ESPERA HORMIPEN.png",
    ],
  },
  {
    slug: "brangus",
    dir: "BRANGUS",
    files: ["BRANGUS 1.png", "BRANGUS 2.png", "BRANGUS 3.png", "BRANGUS 4.png"],
  },
  {
    slug: "hotel-palmar",
    dir: "HOTEL PALMAR",
    files: [
      "RENDER SALA SUITE HOTEL 3.png",
      "RENDER COCINA SUITE HOTEL 1.png",
      "RENDER DORM. SUITE HOTEL 2.png",
    ],
  },
  {
    slug: "suite-palmar",
    dir: "SUITE PALMAR",
    files: [
      "SUITE PALMAR 1.png",
      "SUITE PALMAR 2.png",
      "SUITE PALMAR 3.png",
      "SUITE PALMAR 4.png",
    ],
  },
  {
    slug: "municipio-salinas",
    dir: "MUNICIPIO DE SALINAS",
    files: [
      "MUNICIPIO SALINAS 1.jpeg",
      "MUNICIPIO SALINAS 2.jpeg",
      "MUNICIPIO SALINAS 3.jpeg",
      "MUNICIPIO SALINAS 4.jpeg",
      "MUNICIPIO SALINAS 5.jpeg",
    ],
  },
  {
    slug: "suite-js",
    dir: "RENDERS BAÑOS SALAS COCINAS Y DORMITORIOS",
    files: ["SALA JS.png", "COCINA JS.png", "DORMITORIO JS.png"],
  },
  {
    slug: "suite-nueva-york",
    dir: "RENDERS BAÑOS SALAS COCINAS Y DORMITORIOS",
    files: ["DORMITORIO NY USA.png"],
  },
  {
    slug: "dormitorio-costero",
    dir: "RENDERS BAÑOS SALAS COCINAS Y DORMITORIOS",
    files: ["DORMITORIO PLAYA.png"],
  },
  {
    slug: "bano-spa",
    dir: "RENDERS BAÑOS SALAS COCINAS Y DORMITORIOS",
    files: ["RENDER BAÑO 1.png"],
  },
  {
    slug: "bano-esmeralda",
    dir: "RENDERS BAÑOS SALAS COCINAS Y DORMITORIOS",
    files: ["RENDER BAÑO 2.png"],
  },
  {
    slug: "cocina-urbana",
    dir: "RENDERS BAÑOS SALAS COCINAS Y DORMITORIOS",
    files: ["RENDER COCINA 1.png"],
  },
  {
    slug: "cocina-nocturna",
    dir: "RENDERS BAÑOS SALAS COCINAS Y DORMITORIOS",
    files: ["RENDER COCINA 2.png"],
  },
  {
    slug: "living-abierto",
    dir: "RENDERS BAÑOS SALAS COCINAS Y DORMITORIOS",
    files: ["RENDER SALA COCINA 1.png"],
  },
];

const INSTAGRAM_IMAGES = [
  "foto 1.png",
  "foto 2.png",
  "foto 3.png",
  "foto 4.png",
  "FOTO 5.jpg",
  "FOTO 6.jpg",
  "FOTO 7.jpg",
  "FOTO 8.jpg",
];

async function processInstagram() {
  const srcDir = path.join(ROOT, "Instagram");
  const outDir = path.join(PUBLIC, "instagram");
  fs.mkdirSync(outDir, { recursive: true });
  for (const old of fs.readdirSync(outDir)) fs.rmSync(path.join(outDir, old));

  for (let i = 0; i < INSTAGRAM_IMAGES.length; i++) {
    const outFile = path.join(outDir, `${i + 1}.jpg`);
    await sharp(path.join(srcDir, INSTAGRAM_IMAGES[i]))
      .resize({ width: 1600, withoutEnlargement: true })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 90, mozjpeg: true })
      .toFile(outFile);
    const stat = fs.statSync(outFile);
    console.log(`instagram/${i + 1}.jpg  ${(stat.size / 1024).toFixed(0)}KB`);
  }
}

async function processProjects() {
  for (const project of PROJECTS) {
    const outDir = path.join(PUBLIC, "proyectos", project.slug);
    fs.mkdirSync(outDir, { recursive: true });
    for (let i = 0; i < project.files.length; i++) {
      const src = path.join(ROOT, "proyectos", project.dir, project.files[i]);
      const outFile = path.join(outDir, `${i + 1}.jpg`);
      await sharp(src)
        .resize({ width: 2000, withoutEnlargement: true })
        .flatten({ background: "#ffffff" })
        .jpeg({ quality: 82, mozjpeg: true })
        .toFile(outFile);
      const stat = fs.statSync(outFile);
      console.log(`${project.slug}/${i + 1}.jpg  ${(stat.size / 1024).toFixed(0)}KB`);
    }
  }
}

// Crop heights were measured per-file from the alpha-channel row profile
// (icon glyph ends, then a gap, then the "ADRIAN GUTIERREZ..." wordmark
// starts) so the crop lands in that gap and never clips the icon itself.
async function cropIcon(logoFile, cropHeight, width) {
  const src = path.join(ROOT, "logos", "LOGOS", logoFile);
  const cropped = await sharp(src)
    .extract({ left: 0, top: 0, width: 4921, height: cropHeight })
    .toBuffer();
  return sharp(cropped).trim().resize({ width });
}

async function processLogo() {
  await (await cropIcon("blanco.png", 4030, 480)).toFile(
    path.join(PUBLIC, "logo-icon.png"),
  );
  console.log("public/logo-icon.png written");

  const orangeIcon = await (
    await cropIcon("negro naranja.png", 3850, 512)
  ).toBuffer();
  await sharp(orangeIcon).toFile(path.join(ROOT, "app", "icon.png"));
  console.log("app/icon.png written");

  const meta = await sharp(orangeIcon).metadata();
  const canvas = Math.max(meta.width, meta.height);
  const pad = Math.round(canvas * 0.18);
  const side = canvas + pad * 2;
  await sharp({
    create: {
      width: side,
      height: side,
      channels: 4,
      background: "#ffffff",
    },
  })
    .composite([
      {
        input: orangeIcon,
        left: Math.round((side - meta.width) / 2),
        top: Math.round((side - meta.height) / 2),
      },
    ])
    .png()
    .toFile(path.join(ROOT, "app", "apple-icon.png"));
  console.log("app/apple-icon.png written");
}

async function processHero() {
  const src = path.join(ROOT, "Nueva carpeta", "newhero.mp4");
  if (!fs.existsSync(src)) return;
  const outDir = path.join(PUBLIC, "videos");
  fs.mkdirSync(outDir, { recursive: true });
  fs.copyFileSync(src, path.join(outDir, "hero-banner.mp4"));
  console.log("public/videos/hero-banner.mp4 replaced with newhero.mp4");
}

(async () => {
  await processProjects();
  await processLogo();
  await processInstagram();
  await processHero();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
