import { PROJECTS } from "../../data/projects";
import { archiveActions, useArchive } from "../../state/archiveStore";

export const ProjectNavigation = () => {
  const state = useArchive((snapshot) => snapshot);
  const activeIndex = PROJECTS.findIndex(
    (project) => project.face === (state.selectedFace ?? state.activeFace),
  );
  return (
    <nav className="project-navigation" aria-label="Seleccionar proyecto">
      <span className="nav-label">SELECT</span>
      <div className="nav-items">
        {PROJECTS.map((project, index) => (
          <button
            key={project.id}
            type="button"
            className={index === activeIndex ? "is-active" : undefined}
            onClick={() => archiveActions.selectProject(index)}
            aria-label={`Abrir ${project.title}`}
            aria-current={index === activeIndex ? "true" : undefined}
          >
            {String(index + 1).padStart(2, "0")}
          </button>
        ))}
      </div>
    </nav>
  );
};
