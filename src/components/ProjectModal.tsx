import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import type { Project } from "../api/api";
import { useScrollLock } from "../hooks/useScrollLock";
import { ArrowRight, ArrowUpRight } from "./Icons";

const usable = (url: string | null | undefined): url is string => /^https?:\/\//.test(url ?? "");

type ProjectModalProps = {
  /** The project to show; null closes the modal. */
  project: Project | null;
  /** Which screenshot to open on. */
  startIndex?: number;
  onClose: () => void;
};

/**
 * A project's full details: every screenshot shown whole (contained, never
 * cropped), with arrows, keyboard and thumbnails to move between them, then
 * the full description, stack and links.
 *
 * Built on a native <dialog> opened with showModal(), so focus is trapped,
 * the rest of the page is inert and Escape closes it for free.
 */
const ProjectModal = ({ project, startIndex = 0, onClose }: ProjectModalProps) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [index, setIndex] = useState(startIndex);
  const [shown, setShown] = useState<{ project: Project | null; start: number }>({ project, start: startIndex });

  // Reset to the requested screenshot whenever a different project (or start) opens.
  if (shown.project !== project || shown.start !== startIndex) {
    setShown({ project, start: startIndex });
    setIndex(startIndex);
  }

  useScrollLock(project !== null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (project && !dialog.open) dialog.showModal();
    if (!project && dialog.open) dialog.close();
  }, [project]);

  const images = project?.image_url ?? [];
  const count = images.length;
  const current = count ? Math.min(index, count - 1) : 0;
  const go = (i: number) => setIndex((i + count) % count);

  const onKeyDown = (e: KeyboardEvent<HTMLDialogElement>) => {
    if (count < 2) return;
    const tag = (e.target as HTMLElement).tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      go(current + (e.key === "ArrowRight" ? 1 : -1));
    }
  };

  const paragraphs = (project?.description ?? "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  const code = usable(project?.github_url) ? project.github_url : null;
  const demo = usable(project?.demo_url) ? project.demo_url : null;
  const titleId = project ? `pm-title-${project.id}` : undefined;

  return (
    <dialog
      ref={dialogRef}
      className="pm"
      aria-labelledby={titleId}
      onClose={onClose}
      onKeyDown={onKeyDown}
      // A click on the backdrop lands on the <dialog> itself.
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {project && (
        <div className="pm-panel">
          <button type="button" className="pm-close" onClick={onClose} aria-label="Close project details">
            <span aria-hidden="true">×</span>
          </button>

          {count > 0 && (
            <div className="pm-media">
              <div className="pm-stage">
                <img
                  key={images[current]}
                  src={images[current]}
                  alt={count > 1 ? `${project.name}: screenshot ${current + 1} of ${count}` : `${project.name}: preview`}
                />
                {count > 1 && (
                  <>
                    <button type="button" className="gallery-nav pm-nav pm-prev" onClick={() => go(current - 1)} aria-label="Previous screenshot">
                      <ArrowRight />
                    </button>
                    <button type="button" className="gallery-nav pm-nav pm-next" onClick={() => go(current + 1)} aria-label="Next screenshot">
                      <ArrowRight />
                    </button>
                    <span className="gallery-count pm-count mono" aria-live="polite">
                      {current + 1} / {count}
                    </span>
                  </>
                )}
              </div>

              {count > 1 && (
                <div className="pm-thumbs" role="group" aria-label="Screenshots">
                  {images.map((src, i) => (
                    <button
                      key={src}
                      type="button"
                      className={`pm-thumb${i === current ? " is-active" : ""}`}
                      onClick={() => go(i)}
                      aria-label={`Show screenshot ${i + 1}`}
                      aria-current={i === current ? "true" : undefined}
                    >
                      <img src={src} alt="" loading="lazy" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="pm-body">
            {project.technologies[0] && (
              <p className="pm-meta mono">{project.technologies.slice(0, 2).join(" · ")}</p>
            )}
            <h3 id={titleId} className="pm-title">
              {project.name}
            </h3>

            {paragraphs.length > 0 && (
              <div className="pm-desc">
                {paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            )}

            {project.technologies.length > 0 && (
              <div className="chips pm-chips">
                {project.technologies.map((t) => (
                  <span key={t} className="chip chip-accent">
                    {t}
                  </span>
                ))}
              </div>
            )}

            {(code || demo) && (
              <div className="pm-actions">
                {code && (
                  <a href={code} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                    <FontAwesomeIcon icon={faGithub} /> View code
                  </a>
                )}
                {demo && (
                  <a href={demo} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
                    Live demo <ArrowUpRight />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </dialog>
  );
};

export default ProjectModal;
