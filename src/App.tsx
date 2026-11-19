import { useEffect, useState } from "react";
import { PROJECTS } from "./data/projects";
import { CubeController } from "./components/interaction/CubeController";
import { ArchiveScene } from "./components/scene/Scene";
import { AboutPanel } from "./components/interface/AboutPanel";
import { ContactPanel } from "./components/interface/ContactPanel";
import { DetailsModal } from "./components/interface/DetailsModal";
import { FallbackArchive } from "./components/interface/FallbackArchive";
import { Header } from "./components/interface/Header";
import { InteractionHint } from "./components/interface/InteractionHint";
import { ProjectNavigation } from "./components/interface/ProjectNavigation";
import { ProjectPanel } from "./components/interface/ProjectPanel";
import { StatusIndicator } from "./components/interface/StatusIndicator";
import { usePrefersReducedMotion } from "./hooks/usePrefersReducedMotion";
import { useWebGLSupport } from "./hooks/useWebGLSupport";
import { archiveActions, useArchive } from "./state/archiveStore";

const ArchiveInterface = () => {
  const [controller] = useState(() => new CubeController());
  const reducedMotion = usePrefersReducedMotion();
  const webglSupported = useWebGLSupport();
  const state = useArchive((snapshot) => snapshot);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const editable = target?.closest("input, textarea, select");
      const interactive = target?.closest("button, a");
      if (event.key === "ArrowLeft") {
        if (editable) return;
        event.preventDefault();
        archiveActions.previousProject();
      } else if (event.key === "ArrowRight") {
        if (editable) return;
        event.preventDefault();
        archiveActions.nextProject();
      } else if (event.key === "Enter") {
        if (editable || interactive) return;
        event.preventDefault();
        archiveActions.openDetails();
      } else if (event.key === "Escape") {
        event.preventDefault();
        archiveActions.escape();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (webglSupported === false) return <FallbackArchive />;

  const selectedIndex = state.selectedFace
    ? PROJECTS.findIndex((project) => project.face === state.selectedFace)
    : -1;
  const selectedProject =
    selectedIndex >= 0 ? PROJECTS[selectedIndex].title : "";

  return (
    <div
      className="app"
      data-ready={state.introComplete}
      data-view={state.view ?? "archive"}
      data-mode={state.mode}
      data-details={state.detailsOpen}
    >
      <div className="scene-wrap" aria-hidden="true">
        {webglSupported ? (
          <ArchiveScene
            controller={controller}
            reducedMotion={reducedMotion}
          />
        ) : null}
      </div>
      <div className="scene-shade" aria-hidden="true" />
      <Header />
      <main className="interface">
        <section className="archive-heading" aria-label="Título del archivo">
          <span className="eyebrow">INTERACTIVE WORLDS / VOLUME I</span>
          <h1>MODULAR ARCHIVE</h1>
          <p>
            A modular mechanism of dark glass. Rotate it to open six records
            from the archive.
          </p>
        </section>
        <InteractionHint />
        <StatusIndicator />
        <ProjectNavigation />
        <ProjectPanel />
        <AboutPanel />
        <ContactPanel />
        <DetailsModal />
      </main>
      <div className="intro-curtain" aria-hidden="true" />
      <p className="sr-only" aria-live="polite">
        {state.view === "project" && selectedProject
          ? `${selectedProject} seleccionado. Usa las flechas para navegar, Enter para abrir detalles y Escape para salir.`
          : state.view === "about"
            ? "Sección sobre mí."
            : state.view === "contact"
              ? "Sección de contacto."
              : "Arrastra el mecanismo para rotarlo. Usa las flechas para cambiar de proyecto."}
      </p>
    </div>
  );
};

export default ArchiveInterface;
