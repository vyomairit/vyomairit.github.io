import { useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { ArrowRight } from "./Icons";

type ProjectGalleryProps = {
  images: string[];
  name: string;
  /** Called with the clicked image's index (0 for the fallback) to open details. */
  onOpen: (index: number) => void;
  /** Shown instead when there are no images. */
  fallback: ReactNode;
};

/**
 * A project's screenshots. One image is a plain cover; several become a
 * swipeable strip (native horizontal scroll with snap points, so touch, a
 * trackpad and shift+wheel all work) with arrows, dots and a counter.
 * Each image is its own button that opens the project's details, so the
 * controls are never nested inside it.
 */
const ProjectGallery = ({ images, name, onOpen, fallback }: ProjectGalleryProps) => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [index, setIndex] = useState(0);
  const count = images.length;

  if (!count) {
    return (
      <button type="button" className="gallery-link" onClick={() => onOpen(0)} aria-label={`View ${name} details`}>
        {fallback}
      </button>
    );
  }

  const go = (i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const next = (i + count) % count;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollTo({ left: next * track.clientWidth, behavior: smooth ? "smooth" : "auto" });
  };

  const onScroll = () => {
    const track = trackRef.current;
    if (track?.clientWidth) setIndex(Math.round(track.scrollLeft / track.clientWidth));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (count < 2) return;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      go(index + (e.key === "ArrowRight" ? 1 : -1));
    }
  };

  const slide = (src: string, i: number) => {
    const alt = count > 1 ? `${name}: screenshot ${i + 1} of ${count}` : `${name}: preview`;
    const img = <img src={src} alt="" loading="lazy" draggable={false} />;
    return (
      <button
        type="button"
        className="gallery-link"
        onClick={() => onOpen(i)}
        aria-label={`${alt}. View details`}
        tabIndex={i === index ? 0 : -1}
      >
        {img}
      </button>
    );
  };

  return (
    <div
      className={`gallery${count > 1 ? " gallery--multi" : ""}`}
      role={count > 1 ? "region" : undefined}
      aria-roledescription={count > 1 ? "carousel" : undefined}
      aria-label={count > 1 ? `${name} screenshots` : undefined}
      onKeyDown={onKeyDown}
    >
      <div ref={trackRef} className="gallery-track" onScroll={count > 1 ? onScroll : undefined}>
        {images.map((src, i) => (
          <div
            key={src}
            className="gallery-slide"
            aria-roledescription={count > 1 ? "slide" : undefined}
            aria-hidden={count > 1 && i !== index ? true : undefined}
          >
            {slide(src, i)}
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          <button type="button" className="gallery-nav gallery-prev" onClick={() => go(index - 1)} aria-label="Previous screenshot">
            <ArrowRight />
          </button>
          <button type="button" className="gallery-nav gallery-next" onClick={() => go(index + 1)} aria-label="Next screenshot">
            <ArrowRight />
          </button>
          <div className="gallery-foot">
            <span className="gallery-dots">
              {images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  className={i === index ? "is-active" : undefined}
                  onClick={() => go(i)}
                  aria-label={`Show screenshot ${i + 1}`}
                  aria-current={i === index ? "true" : undefined}
                />
              ))}
            </span>
            <span className="gallery-count mono" aria-live="polite">
              {index + 1} / {count}
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default ProjectGallery;
