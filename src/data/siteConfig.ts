export interface SocialLink {
  label: string;
  handle: string;
  href: string | null;
}

export const siteConfig = {
  name: "[TU NOMBRE]",
  role: "GAME DEVELOPER",
  archiveTitle: "MODULAR ARCHIVE",
  archiveSubtitle: "INTERACTIVE WORLDS / VOLUME I",
  aboutTitle: "ABOUT ME",
  aboutText:
    "Soy desarrollador de videojuegos y me interesa crear experiencias interactivas, experimentar con mecánicas y explorar nuevas posibilidades mediante la programación y el diseño.",
  aboutDetails: [
    "Aquí puedes ampliar tu presentación personal: intereses, formación, experiencia o la clase de proyectos que te gustaría desarrollar.",
    "Este texto es editable y no contiene información profesional inventada.",
  ],
  tags: ["UNITY", "C#", "GAME DEVELOPMENT", "3D", "INTERACTIVE SYSTEMS"],
  contact: {
    title: "CONTACT",
    lead: "Let's create something interesting.",
    note: "Sustituye estos datos en src/data/siteConfig.ts. Los enlaces vacíos permanecen ocultos.",
    email: null as string | null,
    github: null as string | null,
    itch: null as string | null,
    other: null as string | null,
  },
  socials: [
    { label: "GITHUB", handle: "usuario", href: null },
    { label: "ITCH.IO", handle: "usuario", href: null },
    { label: "EMAIL", handle: "correo", href: null },
  ] satisfies SocialLink[],
};
