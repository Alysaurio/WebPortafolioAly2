import { PROJECTS } from "../../data/projects";
import { useArchive } from "../../state/archiveStore";

export const InteractionHint = () => {
  const state = useArchive((snapshot) => snapshot);
  const visible =
    state.introComplete &&
    !state.interacted &&
    !state.view &&
    !state.detailsOpen;
  const previewVisible = state.previewReady && !state.detailsOpen;
  const face = state.activeFace;
  const index = PROJECTS.findIndex((project) => project.face === face);
  const number = String((index < 0 ? 0 : index) + 1).padStart(2, "0");

  return (
    <div className="interaction-hint" data-visible={visible || previewVisible}>
      <div className="hint-line" />
      {previewVisible ? (
        <>
          <span className="hint-primary">RELEASE TO LOCK PROJECT {number}</span>
          <span className="hint-secondary">MAGNETIC ALIGNMENT DETECTED</span>
        </>
      ) : (
        <>
          <span className="hint-primary">DRAG TO ROTATE</span>
          <span className="hint-secondary">EXPLORE THE ARCHIVE</span>
        </>
      )}
    </div>
  );
};
