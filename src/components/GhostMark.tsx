import { useId } from "react";

/**
 * Peekaboo, the site's ghost: a round head peeking over a cyan ledge with its
 * hands on the edge. The head and hands sit in clip groups so `.peek-rise`
 * can slide them down behind the ledge (ducking) and back up.
 *
 * Eyes sit centred on the face so they can look in every direction. Anything
 * that sets --ex / --ey (viewBox units, see useEyeTracking) on an ancestor
 * moves the eyes, and the face follows a little (assistant.css).
 */
export const PEEK_HEAD = "M12 57V34A20 20 0 0 1 52 34V57Z";
const EYES = [25.5, 38.5];
const EYE_Y = 37;

/** useId() output contains characters that break `url(#…)`. */
const useSvgId = () => useId().replace(/[^a-zA-Z0-9_-]/g, "");

/** The ghost's shapes, for embedding inside another SVG. */
export const PeekGhostShapes = ({ mouth = false }: { mouth?: boolean }) => {
  const id = useSvgId();
  return (
    <g className="peek">
      <defs>
        <clipPath id={`${id}-head`}>
          <rect width="64" height="56" />
        </clipPath>
        <clipPath id={`${id}-hands`}>
          <rect width="64" height="57" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-head)`}>
        <g className="peek-rise">
          <g className="peek-face">
            <path className="peek-head" d={PEEK_HEAD} />
            <g className="peek-eyes">
              {EYES.map((cx) => (
                <ellipse key={cx} className="peek-eye" cx={cx} cy={EYE_Y} rx="3.1" ry="3.9" />
              ))}
            </g>
            {mouth && <ellipse className="peek-mouth" cx="32" cy="45.5" rx="2.4" ry="2.1" />}
          </g>
        </g>
      </g>
      <rect className="peek-ledge" x="3" y="51" width="58" height="11" rx="5.5" />
      <g clipPath={`url(#${id}-hands)`}>
        <g className="peek-rise">
          <circle className="peek-hand peek-hand-l" cx="18" cy="51" r="4.6" />
          <circle className="peek-hand peek-hand-r" cx="46" cy="51" r="4.6" />
        </g>
      </g>
    </g>
  );
};

/** The ghost as a standalone SVG. */
export const PeekGhost = ({ className = "", mouth = false }: { className?: string; mouth?: boolean }) => (
  <svg className={`peek-svg ${className}`} viewBox="0 0 64 72" aria-hidden="true" focusable="false">
    <PeekGhostShapes mouth={mouth} />
  </svg>
);

/** Small static mark (nav, AI menu, ask console): ink ghost, cyan ledge. */
const GhostMark = ({ className = "" }: { className?: string }) => <PeekGhost className={`ghost-mark ${className}`} />;

export default GhostMark;
