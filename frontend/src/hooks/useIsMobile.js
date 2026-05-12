import { useEffect, useState } from "react";

// Breakpoint alineado con los media queries que ya usamos en páginas.
const DEFAULT_BREAKPOINT_PX = 900;

export default function useIsMobile(breakpointPx = DEFAULT_BREAKPOINT_PX) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth <= breakpointPx;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia(`(max-width: ${breakpointPx}px)`);
    const onChange = () => setIsMobile(mq.matches);

    onChange();

    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }

    // Safari viejo
    mq.addListener(onChange);
    return () => mq.removeListener(onChange);
  }, [breakpointPx]);

  return isMobile;
}
