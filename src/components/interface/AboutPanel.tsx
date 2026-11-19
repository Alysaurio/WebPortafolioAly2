import { siteConfig } from "../../data/siteConfig";
import { useArchive } from "../../state/archiveStore";

export const AboutPanel = () => {
  const view = useArchive((snapshot) => snapshot.view);
  const open = view === "about";
  return (
    <aside
      className="archive-panel about-panel"
      data-open={open}
      aria-hidden={!open}
      aria-label="Sobre mí"
    >
      <div className="panel-topline">
        <span>ARCHIVE / 01</span>
        <span className="panel-index">ABOUT</span>
      </div>
      <h2 className="panel-title">{siteConfig.aboutTitle}</h2>
      <p className="panel-lead">{siteConfig.aboutText}</p>
      {siteConfig.aboutDetails.map((paragraph) => (
        <p key={paragraph} className="panel-body">
          {paragraph}
        </p>
      ))}
      <div className="tag-row">
        {siteConfig.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
    </aside>
  );
};
