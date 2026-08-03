import { motion } from "framer-motion";
import type { JourneyStage } from "@/lib/mock/dashboard";
import { motion as m, fadeUp } from "@/lib/motion";
import { pct, num } from "@/lib/format";
import { ArrowRight } from "lucide-react";

export function JourneyRail({
  data,
  periodLabel,
}: {
  data: JourneyStage[];
  periodLabel?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: m.duration.slow, ease: m.ease.enter }}
      className="surface-card p-5 md:p-6"
    >
      <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold tracking-tight">Jornada do cliente</h2>
          <p className="text-xs text-muted-foreground">
            Captação → Prospecção → Negociação → Cliente → Receita → Retenção → LTV
          </p>
        </div>
        {periodLabel && (
          <span className="shrink-0 rounded-full border border-border bg-surface-2 px-2 py-1 text-[11px] font-medium text-muted-foreground">
            {periodLabel}
          </span>
        )}
      </div>

      {data.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
          Sem dados da jornada para este período.
        </p>
      ) : (
        <div className="relative">
          <div className="pointer-events-none absolute left-0 right-0 top-[42px] hidden h-[2px] bg-gradient-to-r from-lime/0 via-lime/40 to-violet/40 lg:block" />
          <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {data.map((stage, i) => {
              const isLast = i === data.length - 1;
              return (
                <motion.li
                  key={stage.key}
                  variants={fadeUp}
                  initial="hidden"
                  animate="show"
                  transition={{
                    duration: m.duration.base,
                    ease: m.ease.enter,
                    delay: 0.12 + i * m.stagger.base,
                  }}
                  className="relative"
                >
                  <div className="relative flex flex-col items-start gap-2 rounded-xl border border-border/60 bg-surface/70 p-3 elevate-hover">
                    <div className="flex items-center gap-2">
                      <span className="grid h-6 w-6 place-items-center rounded-md bg-lime/15 text-[10px] font-bold text-lime ring-1 ring-lime/30">
                        {i + 1}
                      </span>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/80">
                        {stage.label}
                      </span>
                    </div>
                    <div className="font-display text-2xl font-bold tracking-tight text-foreground">
                      {num.format(stage.count)}
                    </div>
                    <div className="text-[11px] text-muted-foreground">{stage.hint}</div>
                    {stage.conversion !== null && (
                      <div className="mt-1 flex items-center gap-1 rounded-full bg-lime/10 px-2 py-0.5 text-[10px] font-semibold text-lime ring-1 ring-lime/20">
                        <ArrowRight aria-hidden="true" className="h-3 w-3" />
                        {pct.format(stage.conversion)}
                      </div>
                    )}
                  </div>
                  {!isLast && (
                    <ArrowRight
                      aria-hidden="true"
                      className="absolute -right-2 top-1/2 z-10 hidden h-4 w-4 -translate-y-1/2 text-muted-foreground/60 lg:block"
                    />
                  )}
                </motion.li>
              );
            })}
          </ol>
        </div>
      )}
    </motion.section>
  );
}
