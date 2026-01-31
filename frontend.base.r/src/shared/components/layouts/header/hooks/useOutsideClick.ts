import { RefObject, useEffect } from "react";

/**
 * Accepts an array of refs and a callback.
 * When a click happens outside any of the refs, callback is invoked with the ref that was clicked outside of.
 */
const useOutsideClick = (refs: RefObject<HTMLElement | null>[], cb: (ref: RefObject<HTMLElement | null>) => void) => {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      for (const ref of refs) {
        const el = ref.current;
        if (!el) continue;
        if (!el.contains(e.target as Node)) {
          const insideOther = refs.some((r) => r.current && r.current.contains(e.target as Node));
          if (!insideOther) {
            cb(ref);
            break;
          }
        }
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [refs, cb]);
};

export default useOutsideClick;
