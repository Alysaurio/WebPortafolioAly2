import { PROJECTS, assetUrl } from "../../data/projects";
import { siteConfig } from "../../data/siteConfig";

export const FallbackArchive = () => {
  const contactLinks = [
    siteConfig.contact.email
      ? { label: "EMAIL", href: `mailto:${siteConfig.contact.email}` }
      : null,
    siteConfig.contact.github
      ? { label: "GITHUB", href: siteConfig.contact.github }
      : null,
    siteConfig.contact.itch
      ? { label: "ITCH.IO", href: siteConfig.contact.itch }
      : null,
    siteConfig.contact.other
      ? { label: "LINK", href: siteConfig.contact.other }
      : null,
  ].filter((link): link is { label: string; href: string } => Boolean(link));

  return (
    <div className="fallback">
      <header className="site-header fallback-header">
        <div className="brand">
          <span className="brand-name">{siteConfig.name}</span>
          <span className="brand-role">{siteConfig.role}</span>
        </div>
        <nav className="main-nav" aria-label="Secciones">
          <a href="#archive">ARCHIVE</a>
          <a href="#about">ABOUT</a>
          <a href="#contact">CONTACT</a>
        </nav>
      </header>
      <main>
        <section className="fallback-hero">
          <span className="eyebrow">STATIC ARCHIVE / WEBGL OFF</span>
          <h1>{siteConfig.archiveTitle}</h1>
          <p>
            Tu navegador no puede inicializar la escena 3D. El archivo sigue
            disponible en formato estático.
          </p>
        </section>
        <section id="archive" className="fallback-grid" aria-label="Proyectos">
          {PROJECTS.map((project, index) => (
            <article key={project.id} className="fallback-card">
              <div className="fallback-media">
                <img
                  src={assetUrl(project.image)}
                  alt={`Animación de ${project.title}`}
                  loading={index > 1 ? "lazy" : "eager"}
                />
                <span>{String(index + 1).padStart(2, "0")}</span>
              </div>
              <div className="fallback-copy">
                <div className="panel-topline">
                  <span>PROJECT {String(index + 1).padStart(2, "0")}</span>
                  <span>{project.sourceFile}</span>
                </div>
                <h2>{project.title}</h2>
                <p>{project.description}</p>
                <div className="tag-row">
                  {project.technologies.map((technology) => (
                    <span key={technology}>{technology}</span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </section>
        <section id="about" className="fallback-section">
          <span className="eyebrow">ARCHIVE / 01</span>
          <h2>{siteConfig.aboutTitle}</h2>
          <p>{siteConfig.aboutText}</p>
          <div className="tag-row">
            {siteConfig.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </section>
        <section id="contact" className="fallback-section">
          <span className="eyebrow">ARCHIVE / 02</span>
          <h2>{siteConfig.contact.title}</h2>
          <p className="fallback-lead">{siteConfig.contact.lead}</p>
          {contactLinks.length ? (
            <div className="contact-list">
              {contactLinks.map((link) => (
                <a
                  key={link.label}
                  className="contact-row"
                  href={link.href}
                  target={link.href.startsWith("http") ? "_blank" : undefined}
                  rel={link.href.startsWith("http") ? "noreferrer" : undefined}
                >
                  <span>{link.label}</span>
                  <strong>{link.href}</strong>
                </a>
              ))}
            </div>
          ) : (
            <p>{siteConfig.contact.note}</p>
          )}
        </section>
      </main>
    </div>
  );
};
