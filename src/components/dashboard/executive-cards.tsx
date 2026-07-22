import { motion } from "framer-motion";
import { metrics } from "@/lib/mock/dashboard";
import { CountUp } from "@/components/count-up";
import { motion as m, fadeUp } from "@/lib/motion";
import { pct } from "@/lib/format";
import { TrendingUp, TrendingDown } from "lucide-react";

export function ExecutiveCards() {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          Indicadores executivos
        </h2>
        <span className="text-[11px] text-muted-foreground">vs período anterior</span>
      </div>

      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: m.stagger.tight, delayChildren: 0.15 } } }}
        className="grid grid-cols-2 gap-3 md:grid-cols-4"
      >
        {metrics.map((metric) => {
          const positive = metric.delta >= 0;
          const Trend = positive ? TrendingUp : TrendingDown;
          return (
            <motion.article
              key={metric.key}
              variants={fadeUp}
              transition={{ duration: m.duration.base, ease: m.ease.enter }}
              className="surface-card elevate-hover p-4"
            >
              <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {metric.label}
              </div>
              <div className="mt-2 font-display text-2xl font-bold tracking-tight md:text-3xl">
                <CountUp value={metric.value} format={metric.format} />
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px]">
                <span
                  className={
                    "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-semibold ring-1 " +
                    (positive
                      ? "bg-lime/10 text-lime ring-lime/20"
                      : "bg-danger/10 text-danger ring-danger/20")
                  }
                >
                  <Trend className="h-3 w-3" />
                  {pct.format(Math.abs(metric.delta))}
                </span>
                <span className="text-muted-foreground">{metric.hint}</span>
              </div>
            </motion.article>
          );
        })}
      </motion.div>
    </section>
  );
}
