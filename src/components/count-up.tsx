import { useInView, animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { formatMetric } from "@/lib/format";

export function CountUp({
  value,
  format,
  duration = 1.2,
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
    const controls = animate(0, value, {
      duration,
      ease: [0.2, 0, 0, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [inView, value, duration]);

  return <span ref={ref}>{formatMetric(display, format)}</span>;
}
