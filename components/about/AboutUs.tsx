"use client";

import { useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

/**
 * UI-02 on the web: an "About us" link in the header that opens the About sheet.
 * Phones: a bottom sheet that slides up, with a drag handle; swipe down to close.
 * Larger screens: a centred panel. Esc, the X button and a click outside all close it, and
 * focus returns to the link (native <dialog>). Without JavaScript, or with a modifier-click,
 * the link simply opens the /about/ page.
 *
 * The dialog is portalled to <body> once hydrated, so it sits outside the header landmark and
 * the About text isn't repeated in every page's HTML (the /about/ page carries it for sharing).
 */
const noop = () => () => {};
export function AboutUs({ children }: { children: React.ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y: number; dy: number } | null>(null);
  const hydrated = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

  function open(e: React.MouseEvent<HTMLAnchorElement>) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    dialog.current?.showModal();
    panel.current?.querySelector<HTMLElement>("[data-scroll]")?.scrollTo(0, 0);
  }
  const close = () => dialog.current?.close();

  // Swipe down to dismiss, from the handle or anywhere while the content is scrolled to the top.
  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType === "mouse") return;
    const scroller = panel.current?.querySelector<HTMLElement>("[data-scroll]");
    if (scroller && scroller.scrollTop > 0 && !(e.target as HTMLElement).closest("[data-handle]")) return;
    drag.current = { y: e.clientY, dy: 0 };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current || !panel.current) return;
    drag.current.dy = Math.max(0, e.clientY - drag.current.y);
    panel.current.style.transform = `translateY(${drag.current.dy}px)`;
  }
  function onPointerUp() {
    if (!drag.current || !panel.current) return;
    const { dy } = drag.current;
    drag.current = null;
    panel.current.style.transform = "";
    if (dy > 100) close();
  }

  return (
    <>
      <a href="/about/" onClick={open} className="text-lamp rounded text-sm font-medium hover:underline">
        About us
      </a>
      {hydrated &&
        createPortal(
          <dialog
            ref={dialog}
            aria-label="About us"
            // A click on the backdrop lands on the dialog element itself.
            onClick={(e) => e.target === e.currentTarget && close()}
            className="m-0 h-dvh max-h-none w-full max-w-none items-end justify-center bg-transparent p-0 backdrop:bg-black/55 open:flex md:items-center"
          >
            <div
              ref={panel}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              className="bg-bg text-fg border-line animate-sheet-up relative flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-b-0 transition-transform duration-200 md:max-h-[85vh] md:max-w-[640px] md:rounded-2xl md:border-b"
            >
              <div className="flex items-center justify-end px-4 pt-2">
                <span
                  data-handle
                  aria-hidden="true"
                  className="bg-line absolute top-2 left-1/2 h-1 w-10 -translate-x-1/2 touch-none rounded-full md:hidden"
                />
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close"
                  className="text-muted hover:text-fg mt-1 grid size-9 place-items-center rounded-full"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" fill="currentColor" opacity=".25" />
                    <path
                      d="M9 9l6 6M15 9l-6 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
              <div
                data-scroll
                className="overflow-y-auto overscroll-contain px-6 pt-1 pb-[max(20px,env(safe-area-inset-bottom))]"
              >
                {children}
              </div>
            </div>
          </dialog>,
          document.body,
        )}
    </>
  );
}
