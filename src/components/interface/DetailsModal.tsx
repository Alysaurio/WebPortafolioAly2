import { useEffect, useRef } from "react";
import { PROJECTS, projectByFace } from "../../data/projects";
import { archiveActions, useArchive } from "../../state/archiveStore";

export const DetailsModal = () => {
  const state = useArchive((snapshot) => snapshot);
  const closeButton = useRef<HTMLButtonElement>(null);
  const project = state.selectedFace
    ? projectByFace(state.selectedFace)
    : undefined;
  const open = state.detailsOpen && Boolean(project);

  useEffect(() => {
    if (open) closeButton.current?.focus();
  }, [open]);

  if (!project) return null;
  const index = PROJECTS.findIndex((entry) => entry.id === project.id) + 1;

  return (
    <div
      className="details-backdrop"
      data-open={open}
      aria-hidden={!open}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) archiveActions.closeDetails();
      }}
    >
      <article
        className="details-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="details-title"
      >
        <div className="details-topline">
          <span>ARCHIVE RECORD / {String(index).padStart(2, "0")}</span>
          <button
            ref={closeButton}
            type="button"
            className="details-close"
            onClick={archiveActions.closeDetails}
            aria-label="Cerrar detalles"
          >
            CLOSE
          </button>
        </div>
        <h2 id="details-title">{project.title}</h2>
        <div className="details-grid">
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
          <div>
            <span>SOURCE</span>
            <strong>{project.sourceFile}</strong>
          </div>
        </div>
        <p className="details-body">{project.description}</p>
        <div className="tag-row">
          {project.technologies.map((technology) => (
            <span key={technology}>{technology}</span>
          ))}
        </div>
        <div className="details-footer">
          {project.externalUrl ? (
            <a
              className="panel-action"
              href={project.externalUrl}
              target="_blank"
              rel="noreferrer"
            >
              <span>OPEN PROJECT</span>
              <span aria-hidden="true">↗</span>
            </a>
          ) : (
            <span className="details-empty">
              ENLACE EXTERNO NO CONFIGURADO
            </span>
          )}
        </div>
      </article>
    </div>
  );
};
