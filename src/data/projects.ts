import type { FaceKey } from "./faces";

export type ImageFit = "cover" | "contain";

export interface Project {
  id: string;
  title: string;
  image: string;
  sourceFile: string;
  face: FaceKey;
  genre: string;
  engine: string;
  technologies: string[];
  description: string;
  year?: string;
  imageFit: ImageFit;
  focalPoint: [number, number];
  externalUrl?: string;
}

const description = (index: number) =>
  `Registro ${String(index).padStart(2, "0")}. Descripción pendiente de edición: explica aquí la mecánica principal, tu rol en el desarrollo y el contexto del proyecto.`;

export const PROJECTS: Project[] = [
  {
    id: "project-01",
    title: "PROJECT 01",
    image: "projects/cat.gif",
    sourceFile: "cat.gif",
    face: "+Z",
    genre: "GÉNERO POR DEFINIR",
    engine: "Unity",
    technologies: ["Unity", "C#"],
    description: description(1),
    imageFit: "cover",
    focalPoint: [0.5, 0.5],
  },
  {
    id: "project-02",
    title: "PROJECT 02",
    image: "projects/george-sigma.gif",
    sourceFile: "george-sigma.gif",
    face: "+X",
    genre: "GÉNERO POR DEFINIR",
    engine: "Unity",
    technologies: ["Unity", "C#"],
    description: description(2),
    imageFit: "cover",
    focalPoint: [0.5, 0.5],
  },
  {
    id: "project-03",
    title: "PROJECT 03",
    image: "projects/homer-simpson-baki-hanma.gif",
    sourceFile: "homer-simpson-baki-hanma.gif",
    face: "-Z",
    genre: "GÉNERO POR DEFINIR",
    engine: "Unity",
    technologies: ["Unity", "C#"],
    description: description(3),
    imageFit: "cover",
    focalPoint: [0.5, 0.5],
  },
  {
    id: "project-04",
    title: "PROJECT 04",
    image: "projects/kermit-falling.gif",
    sourceFile: "kermit-falling.gif",
    face: "-X",
    genre: "GÉNERO POR DEFINIR",
    engine: "Unity",
    technologies: ["Unity", "C#"],
    description: description(4),
    imageFit: "cover",
    focalPoint: [0.5, 0.5],
  },
  {
    id: "project-05",
    title: "PROJECT 05",
    image: "projects/sanandre.gif",
    sourceFile: "sanandre.gif",
    face: "+Y",
    genre: "GÉNERO POR DEFINIR",
    engine: "Unity",
    technologies: ["Unity", "C#"],
    description: description(5),
    imageFit: "cover",
    focalPoint: [0.5, 0.42],
  },
  {
    id: "project-06",
    title: "PROJECT 06",
    image: "projects/skibidi-dop-dop-200fps.gif",
    sourceFile: "skibidi-dop-dop-200fps.gif",
    face: "-Y",
    genre: "GÉNERO POR DEFINIR",
    engine: "Unity",
    technologies: ["Unity", "C#"],
    description: description(6),
    imageFit: "cover",
    focalPoint: [0.5, 0.5],
  },
];

export const projectByFace = (face: FaceKey) =>
  PROJECTS.find((project) => project.face === face);

export const assetUrl = (path: string) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;
