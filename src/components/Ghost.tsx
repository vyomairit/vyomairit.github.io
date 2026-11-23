import { useEffect, useRef, useState } from "react";
import { useAssistantStore } from "../stores/useAssistantStore";
import { useEyeTracking } from "../hooks/useEyeTracking";
import { PeekGhost } from "./GhostMark";

const HINT_KEY = "vyomairit-ghost-hint";

/**
 * The floating assistant in the bottom corner: Peekaboo, peeking over its
 * ledge. It breathes in place and follows the pointer with its eyes in every
 * direction; clicking it (or ⌘K / Ctrl+K) makes it duck and pop back up and
 * opens the AI menu. Tracking writes CSS variables (see useEyeTracking), so
 * it never re-renders React.
 */
const Ghost = () => {
  const open = useAssistantStore((s) => s.open);
  const toggleMenu = useAssistantStore((s) => s.toggleMenu);
  const rootRef = useRef<HTMLButtonElement | null>(null);
  const [hint, setHint] = useState(false);

  // Eyes (and a little of the face) follow the pointer in every direction,
  // or the finger, or the scroll; it glances around when idle. No body lean:
  // the ledge stays level.
  useEyeTracking(rootRef, { reach: 3.6, tilt: 0, eyeLine: 0.46 });

  // Clicking makes it duck behind the ledge and pop back up.
  const onClick = () => {
    const el = rootRef.current;
    if (el) {
      el.classList.remove("is-popping");
      void el.offsetWidth; // restart the animation on repeated clicks
      el.classList.add("is-popping");
    }
    toggleMenu();
  };

  // Introduce itself once per session, a few seconds after the page settles.
  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(HINT_KEY) === "1";
    } catch {
      /* storage blocked — show the hint, it's harmless */
    }
    if (seen) return;
    // Opening the menu (by any route) dismisses the hint for good.
    const unsubscribe = useAssistantStore.subscribe((state) => {
      if (state.open) setHint(false);
    });
    const show = setTimeout(() => {
      if (!useAssistantStore.getState().open) setHint(true);
    }, 3500);
    const hide = setTimeout(() => {
      setHint(false);
      try {
        sessionStorage.setItem(HINT_KEY, "1");
      } catch {
        /* not persisted */
      }
    }, 9000);
    return () => {
      unsubscribe();
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, []);

  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <div className={`ghost-dock${open ? " is-open" : ""}${hint ? " show-hint" : ""}`}>
      <div className="ghost-hint" role="status">
        <strong>Ask me about Deepak</strong>
        <span className="mono">
          <kbd>{isMac ? "⌘" : "Ctrl"}</kbd>
          <kbd>K</kbd>
        </span>
      </div>

      <button
        ref={rootRef}
        type="button"
        className="ghost"
        onClick={onClick}
        onAnimationEnd={(e) => {
          if (e.animationName === "peek-pop") rootRef.current?.classList.remove("is-popping");
        }}
        aria-label={open ? "Close the AI menu" : "Open the AI menu: ask about Deepak's work"}
        aria-expanded={open}
        aria-controls="ai-menu"
        aria-haspopup="dialog"
      >
        <span className="ghost-sparkles" aria-hidden="true">
          <i className="sp sp-plus sp-1" />
          <i className="sp sp-x sp-2" />
          <i className="sp sp-o sp-3" />
          <i className="sp sp-plus sp-4" />
          <i className="sp sp-x sp-5" />
          <i className="sp sp-o sp-6" />
        </span>

        <span className="ghost-float" aria-hidden="true">
          <PeekGhost className="ghost-svg" mouth />
        </span>

        <span className="ghost-shadow" aria-hidden="true" />
      </button>
    </div>
  );
};

export default Ghost;
