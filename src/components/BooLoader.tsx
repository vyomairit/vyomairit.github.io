import { useEffect, useState } from "react";
import { PeekGhost } from "./GhostMark";

const LINES = ["Summoning an answer", "Haunting his work history", "Asking the spirits (and the LLM)", "Almost there"];
const LINE_MS = 1900;

/**
 * The answer's preloader: the ghost sinks behind its ledge, drums its fingers
 * and looks side to side, then pops up with a "BOO!", on a loop, while the
 * status line drifts through a few phrases.
 */
const BooLoader = () => {
  const [line, setLine] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setLine((i) => Math.min(i + 1, LINES.length - 1)), LINE_MS);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="boo" role="status" aria-label="The ghost is thinking">
      <div className="boo-stage" aria-hidden="true">
        <span className="boo-bubble">BOO!</span>
        <PeekGhost className="boo-ghost" mouth />
        <span className="boo-shadow" />
      </div>
      <p className="boo-text mono" aria-hidden="true">
        <span key={line} className="boo-line">
          {LINES[line]}
        </span>
        <span className="dots">
          <i />
          <i />
          <i />
        </span>
      </p>
    </div>
  );
};

export default BooLoader;
