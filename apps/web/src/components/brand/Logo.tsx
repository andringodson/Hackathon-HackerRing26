import { cn } from "@/lib/utils";

/*
 * The mark: three arcs around one point. The arcs are independent sources (sensors, official
 * feeds, reports) and the point is the event they agree on, the platform's idea of a verified
 * event. It also reads as an epicentre with its rings. app/icon.svg draws the same geometry.
 *
 * Arcs span 90 degrees on a radius-11 circle, with 30-degree gaps centred at the top,
 * lower right and lower left.
 */
const ARCS = [
  "M18.85 5.38A11 11 0 0 1 26.63 18.85",
  "M23.78 23.78A11 11 0 0 1 8.22 23.78",
  "M5.38 18.85A11 11 0 0 1 13.15 5.38",
];

interface LogoMarkProps {
  className?: string;
  /** Arcs draw in and converge, the point locks, then the arcs keep orbiting (the boot screen). */
  animated?: boolean;
}

/** Uses currentColor, so set the colour with a text-* class. Decorative: pair it with a label. */
export function LogoMark({ className, animated = false }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden
      focusable="false"
      className={cn(animated && "logo-animated", className)}
    >
      <g className="logo-orbit">
        <g
          className="logo-arcs"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
        >
          {ARCS.map((d) => (
            <path key={d} d={d} pathLength={1} />
          ))}
        </g>
      </g>
      <circle className="logo-core" cx={16} cy={16} r={3.5} fill="currentColor" />
    </svg>
  );
}
