import { PROJECTS } from "../../data/projects";
import { useTextureProgress } from "../../hooks/useAnimatedTexture";
import { useArchive } from "../../state/archiveStore";

export const StatusIndicator = () => {
  const state = useArchive((snapshot) => snapshot);
  const progress = useTextureProgress();
  const face = state.selectedFace ?? state.activeFace;
  const index = PROJECTS.findIndex((project) => project.face === face);
  const number = String((index < 0 ? 0 : index) + 1).padStart(2, "0");

  let system = "SYNCING SIGNAL";
  if (progress.total > 0 && progress.loaded === progress.total) {
    system = "SYSTEM READY";
  } else if (progress.errors > 0) {
    system = "PARTIAL ARCHIVE";
  } else if (progress.total > 0) {
    system = `SYNCING ${String(progress.loaded).padStart(2, "0")}/${String(
      progress.total,
    ).padStart(2, "0")}`;
  }

  let context = `PROJECT ${number} / 06`;
  if (state.view === "about") context = "ARCHIVE / ABOUT";
  if (state.view === "contact") context = "ARCHIVE / CONTACT";
  if (!state.introComplete) context = "CALIBRATING";

  return (
    <div className="status-indicator" aria-live="polite">
      <span className={`status-dot ${progress.errors ? "is-warning" : ""}`} />
      <span className="status-system">{system}</span>
      <span className="status-divider" />
      <span className="status-context">{context}</span>
    </div>
  );
};
