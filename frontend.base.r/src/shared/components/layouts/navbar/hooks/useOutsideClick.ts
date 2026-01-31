import { RefObject, useEffect } from "react";

const useOutsideClick = (
  refs: RefObject<HTMLElement | null>[],
  cb: (ref: RefObject<HTMLElement | null> | null) => void
) => {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;

      for (const ref of refs) {
        const el = ref.current;
        if (el && el.contains(target)) {
          cb(ref);
          return;
        }
      }

      cb(null);
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [refs, cb]);
};

export default useOutsideClick;
