import { PROJECTS, projectByFace } from "../../data/projects";
import {
  archiveActions,
  useArchive,
} from "../../state/archiveStore";

export const ProjectPanel = () => {
  const state = useArchive((snapshot) => snapshot);
  const project =
    (state.selectedFace ? projectByFace(state.selectedFace) : null) ??
    projectByFace(state.activeFace) ??
    PROJECTS[0];
  const index = PROJECTS.findIndex((entry) => entry.id === project.id);
  const open = state.view === "project" && Boolean(state.selectedFace);

  return (
    <aside
      className="archive-panel project-panel"
      data-open={open}
      aria-hidden={!open}
      aria-label="Proyecto seleccionado"
    >
      <div className="panel-topline">
        <span>PROJECT {String(index + 1).padStart(2, "0")}</span>
        <div className="panel-topline-actions">
          <span className="panel-index">/ 06</span>
          <button
            type="button"
            className="panel-close"
            onClick={archiveActions.openArchive}
            aria-label="Cerrar proyecto"
          >
            CLOSE
          </button>
        </div>
      </div>
      <h2 className="panel-title">{project.title}</h2>
      <div className="panel-meta">
        <div>
          <span>GENRE</span>
          <strong>{project.genre}</strong>
        </div>
        <div>
          <span>ENGINE</span>
          <strong>{project.engine}</strong>
        </div>
        <div>
          <span>YEAR</span>
          <strong>{project.year ?? "—"}</strong>
        </div>
      </div>
      <p className="panel-description">{project.description}</p>
      <div className="tag-row">
        {project.technologies.map((technology) => (
          <span key={technology}>{technology}</span>
        ))}
      </div>
      <button
        type="button"
        className="panel-action"
        onClick={archiveActions.openDetails}
      >
        <span>PROJECT DETAILS</span>
        <span aria-hidden="true">↗</span>
      </button>
      <span className="panel-source">{project.sourceFile}</span>
    </aside>
  );
};
