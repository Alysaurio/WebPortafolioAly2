import { archiveActions, useArchive } from "../../state/archiveStore";
import { siteConfig } from "../../data/siteConfig";

export const Header = () => {
  const view = useArchive((snapshot) => snapshot.view);
  return (
    <header className="site-header">
      <button
        type="button"
        className="brand"
        onClick={archiveActions.openArchive}
        aria-label="Volver al archivo"
      >
        <span className="brand-name">{siteConfig.name}</span>
        <span className="brand-role">{siteConfig.role}</span>
      </button>
      <nav className="main-nav" aria-label="Secciones del archivo">
        <button
          type="button"
          className={view === "project" ? "is-active" : undefined}
          onClick={archiveActions.openArchive}
        >
          ARCHIVE
        </button>
        <button
          type="button"
          className={view === "about" ? "is-active" : undefined}
          onClick={archiveActions.openAbout}
        >
          ABOUT
        </button>
        <button
          type="button"
          className={view === "contact" ? "is-active" : undefined}
          onClick={archiveActions.openContact}
        >
          CONTACT
        </button>
      </nav>
    </header>
  );
};
