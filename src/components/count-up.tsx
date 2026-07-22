import { useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { formatMetric } from "@/lib/format";

// Simple rAF-based count-up. Runs once on first view.
export function CountUp({
  value,
  format,
  duration = 1200,
}: {
  value: number;
  format: "number" | "currency" | "percent";
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const from = 0;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const v = from + (value - from) * ease(t);
      setDisplay(v);
      if (t < 1) raf = requestAnimationFrame(step);
      else setDisplay(value);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration]);

  return <span ref={ref}>{formatMetric(display, format)}</span>;
}
