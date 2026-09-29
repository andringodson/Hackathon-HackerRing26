"use client";

import { useEffect, useRef } from "react";
import { LOGO_ARCS } from "@/components/brand/Logo";
import { useMediaQuery } from "@/hooks/useMediaQuery";

/** Only where there is a real mouse or pen. Touch screens keep their default behaviour. */
const FINE_POINTER_QUERY = "(hover: hover) and (pointer: fine)";

const INTERACTIVE = [
  "a[href]",
  "button:not(:disabled)",
  "select:not(:disabled)",
  "summary",
  "label",
  '[role="button"]:not([aria-disabled="true"])',
  '[role="tab"]',
  '[role="switch"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="slider"]',
  '[role="option"]',
  '[role="menuitem"]',
  '[role="menuitemradio"]',
  '[role="menuitemcheckbox"]',
].join(",");

/** Where the native text cursor is more precise; the live cursor steps aside there. */
const TEXT_ENTRY =
  'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="button"]):not([type="submit"]), textarea, [contenteditable="true"]';

/**
 * The pointer as a live scanner: the logo's three arcs orbit the hotspot while a radar ping pulses
 * out. Over something clickable it locks on (arcs widen and spin faster); pressing contracts it.
 *
 * Follows the pointer through a ref and one transform per frame, so moving the mouse never
 * re-renders React. The native cursor is hidden only while this is mounted (html.live-cursor),
 * so if the script fails the normal cursor is still there.
 */
export function LiveCursor() {
  const enabled = useMediaQuery(FINE_POINTER_QUERY);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;
    const root = document.documentElement;
    root.classList.add("live-cursor");

    let frame = 0;
    let x = 0;
    let y = 0;
    const paint = () => {
      frame = 0;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      x = event.clientX;
      y = event.clientY;
      el.dataset.visible = "true";
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const onOver = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      el.dataset.state = target?.closest(TEXT_ENTRY)
        ? "text"
        : target?.closest(INTERACTIVE)
          ? "target"
          : "idle";
    };
    const onDown = () => {
      el.dataset.pressed = "true";
    };
    const onUp = () => {
      el.dataset.pressed = "false";
    };
    const onLeave = () => {
      el.dataset.visible = "false";
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    root.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      root.classList.remove("live-cursor");
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      root.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div ref={ref} aria-hidden className="live-cursor-el" data-state="idle" data-visible="false">
      <span className="live-cursor-ping" />
      <svg viewBox="0 0 32 32" className="live-cursor-mark">
        <g
          className="live-cursor-arcs"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
        >
          {LOGO_ARCS.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
        <circle className="live-cursor-core" cx={16} cy={16} r={2.75} fill="currentColor" />
      </svg>
    </div>
  );
}
