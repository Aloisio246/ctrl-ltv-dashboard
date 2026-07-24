import { motion } from "framer-motion";
import { journey, type JourneyStage } from "@/lib/mock/dashboard";
import { motion as m, fadeUp } from "@/lib/motion";
import { pct, num } from "@/lib/format";
import { ArrowRight } from "lucide-react";

export function JourneyRail({ data = journey }: { data?: JourneyStage[] }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: m.duration.slow, ease: m.ease.enter }}
      className="surface-card p-5 md:p-6"
    >
      <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight">
            Jornada do cliente
          </h2>
          <p className="text-xs text-muted-foreground">
            Captação → Prospecção → Negociação → Cliente → Receita → Retenção → LTV
          </p>
        </div>
        <span className="rounded-full border border-border/70 bg-background/40 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          últimos 30 dias
        </span>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute left-0 right-0 top-[42px] hidden h-[2px] bg-gradient-to-r from-lime/0 via-lime/40 to-violet/40 lg:block" />
        <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {data.map((stage, i) => {
            const isLast = i === journey.length - 1;
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
                    <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      {stage.label}
                    </span>
                  </div>
                  <div className="font-display text-2xl font-bold tracking-tight text-foreground">
                    {num.format(stage.count)}
                  </div>
                  <div className="text-[11px] text-muted-foreground">{stage.hint}</div>
                  {stage.conversion !== null && (
                    <div className="mt-1 flex items-center gap-1 rounded-full bg-lime/10 px-2 py-0.5 text-[10px] font-semibold text-lime ring-1 ring-lime/20">
                      <ArrowRight className="h-3 w-3" />
                      {pct.format(stage.conversion)}
                    </div>
                  )}
                </div>
                {!isLast && (
                  <ArrowRight className="absolute -right-2 top-1/2 z-10 hidden h-4 w-4 -translate-y-1/2 text-muted-foreground/50 lg:block" />
                )}
              </motion.li>
            );
          })}
        </ol>
      </div>
    </motion.section>
  );
}
