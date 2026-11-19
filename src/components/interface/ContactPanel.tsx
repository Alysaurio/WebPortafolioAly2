import { useRef, useState } from "react";
import { siteConfig } from "../../data/siteConfig";
import { useArchive } from "../../state/archiveStore";

interface ContactRow {
  label: string;
  href: string;
  value: string;
}

export const ContactPanel = () => {
  const view = useArchive((snapshot) => snapshot.view);
  const open = view === "contact";
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);
  const { contact } = siteConfig;

  const rows: ContactRow[] = [];
  if (contact.email) {
    rows.push({
      label: "EMAIL",
      href: `mailto:${contact.email}`,
      value: contact.email,
    });
  }
  if (contact.github) {
    rows.push({ label: "GITHUB", href: contact.github, value: contact.github });
  }
  if (contact.itch) {
    rows.push({ label: "ITCH.IO", href: contact.itch, value: contact.itch });
  }
  if (contact.other) {
    rows.push({ label: "LINK", href: contact.other, value: contact.other });
  }

  const copyEmail = async () => {
    if (!contact.email) return;
    try {
      await navigator.clipboard.writeText(contact.email);
      setCopied(true);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <aside
      className="archive-panel contact-panel"
      data-open={open}
      aria-hidden={!open}
      aria-label="Contacto"
    >
      <div className="panel-topline">
        <span>ARCHIVE / 02</span>
        <span className="panel-index">CONTACT</span>
      </div>
      <h2 className="panel-title">{contact.title}</h2>
      <p className="panel-lead">{contact.lead}</p>
      {rows.length > 0 ? (
        <div className="contact-list">
          {rows.map((row) => (
            <a
              key={row.label}
              className="contact-row"
              href={row.href}
              target={row.href.startsWith("http") ? "_blank" : undefined}
              rel={row.href.startsWith("http") ? "noreferrer" : undefined}
            >
              <span>{row.label}</span>
              <strong>{row.value}</strong>
            </a>
          ))}
        </div>
      ) : (
        <p className="panel-body">{contact.note}</p>
      )}
      {contact.email ? (
        <button type="button" className="panel-action" onClick={copyEmail}>
          <span>{copied ? "EMAIL COPIED" : "COPY EMAIL"}</span>
          <span aria-hidden="true">{copied ? "✓" : "⧉"}</span>
        </button>
      ) : null}
      <span className="panel-source">MODULAR ARCHIVE / OPEN CHANNEL</span>
    </aside>
  );
};
