/**
 * Live region for the one thing allowed to grab attention on its own: a toast when a new critical
 * event arrives ("New critical event: Assam M6.2 [View]"), also announced to screen readers.
 *
 * The region has to exist before it has content, or screen readers will not announce what appears
 * in it, so it is always mounted. TODO(F4): a small toast store, driven by the WebSocket's
 * event.created messages, that renders here.
 */
export function ToastCenter() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-3"
    />
  );
}
