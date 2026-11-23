import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import type { Project } from "../api/api";
import { useScrollLock } from "../hooks/useScrollLock";
import { ArrowRight, ArrowUpRight } from "./Icons";

const MIN_THUMB = 32; // px

/**
 * The modal's scrollbar, in the same style as the page's ScrollRail: a thin
 * accent line that thickens on hover and can be dragged or clicked. The
 * native scrollbar of `scroller` is hidden in CSS (.pm-scroll).
 */
const useModalRail = (active: boolean) => {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const railRef = useRef<HTMLDivElement | null>(null);
  const dragOffset = useRef<number | null>(null);

  const metrics = () => {
    const el = scrollerRef.current;
    if (!el) return null;
    const view = el.clientHeight;
    const max = el.scrollHeight - view;
    const thumb = Math.max(MIN_THUMB, (view / el.scrollHeight) * view);
    return { el, view, max, thumb };
  };

  const sync = useCallback(() => {
    const m = metrics();
    const rail = railRef.current;
    if (!m || !rail) return;
    rail.hidden = m.max <= 1;
    rail.style.setProperty("--thumb", `${m.thumb}px`);
    rail.style.setProperty("--y", `${m.max > 0 ? (m.el.scrollTop / m.max) * (m.view - m.thumb) : 0}px`);
  }, []);

  // Re-measure when content or size changes (images load, screenshot switches).
  useEffect(() => {
    if (!active) return;
    const el = scrollerRef.current;
    if (!el) return;
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    Array.from(el.children).forEach((c) => ro.observe(c));
    return () => ro.disconnect();
  }, [active, sync]);

  const scrollToThumb = (y: number) => {
    const m = metrics();
    if (!m) return;
    const travel = m.view - m.thumb;
    const p = travel > 0 ? Math.min(Math.max(y / travel, 0), 1) : 0;
    m.el.scrollTop = p * m.max;
  };

  const railY = (e: ReactPointerEvent<HTMLDivElement>) => e.clientY - e.currentTarget.getBoundingClientRect().top;

  const railProps = {
    ref: railRef,
    className: "pm-rail",
    "aria-hidden": true as const,
    onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      const rect = e.currentTarget.querySelector("i")?.getBoundingClientRect();
      const onThumb = rect && e.clientY >= rect.top && e.clientY <= rect.bottom;
      // On the thumb: keep the grab point. On the track: centre the thumb there.
      dragOffset.current = onThumb && rect ? e.clientY - rect.top : (metrics()?.thumb ?? 0) / 2;
      scrollToThumb(railY(e) - dragOffset.current);
      e.currentTarget.setPointerCapture(e.pointerId);
      e.currentTarget.classList.add("is-dragging");
      e.preventDefault();
    },
    onPointerMove: (e: ReactPointerEvent<HTMLDivElement>) => {
      if (dragOffset.current !== null) scrollToThumb(railY(e) - dragOffset.current);
    },
    onPointerUp: (e: ReactPointerEvent<HTMLDivElement>) => {
      dragOffset.current = null;
      e.currentTarget.classList.remove("is-dragging");
    },
  };

  return { scrollerRef, onScroll: sync, railProps };
};

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
  const { scrollerRef, onScroll, railProps } = useModalRail(project !== null);

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

          <div ref={scrollerRef} className="pm-scroll" onScroll={onScroll}>

            {count > 0 && (
              <div className="pm-media">
                <div className={`pm-stage${count > 1 ? " pm-stage--multi" : ""}`}>
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

          <div {...railProps} onPointerCancel={railProps.onPointerUp}>
            <i />
          </div>
        </div>
      )}
    </dialog>
  );
};

export default ProjectModal;
