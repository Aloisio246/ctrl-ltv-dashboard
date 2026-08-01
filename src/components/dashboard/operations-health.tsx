import { motion } from "framer-motion";
import type { DashboardSummary } from "@/lib/api-client";
import { motion as m, fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

type HealthDomain = DashboardSummary["operationsHealth"][number] & { status: "healthy" | "attention" | "at_risk" | "critical" };
const statusMeta: Record<HealthDomain["status"], { label: string; tone: string; bar: string }> = {
  healthy: { label: "Saudável", tone: "text-lime ring-lime/25 bg-lime/10", bar: "bg-lime" },
  attention: { label: "Atenção", tone: "text-warning ring-warning/25 bg-warning/10", bar: "bg-warning" },
  at_risk: { label: "Em risco", tone: "text-danger ring-danger/25 bg-danger/10", bar: "bg-danger" },
  critical: { label: "Crítico", tone: "text-danger ring-danger/25 bg-danger/10", bar: "bg-danger" },
};

function statusFor(score: number): HealthDomain["status"] {
  if (score >= 80) return "healthy";
  if (score >= 60) return "attention";
  if (score >= 40) return "at_risk";
  return "critical";
}

export function OperationsHealth({ data: health }: { data: DashboardSummary["operationsHealth"] }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: m.duration.slow, ease: m.ease.enter, delay: 0.3 }}
      className="surface-card p-5 md:p-6"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight">
            Saúde da operação
          </h2>
          <p className="text-xs text-muted-foreground">
            Sinal consolidado por domínio operacional
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {health.map((d, i) => {
          const status = statusFor(d.score);
          const meta = statusMeta[status];
          return (
            <motion.article
              key={d.key}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              transition={{
                duration: m.duration.base,
                ease: m.ease.enter,
                delay: 0.36 + i * m.stagger.tight,
              }}
              className="rounded-xl border border-border/60 bg-surface/60 p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {d.label}
                </span>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1", meta.tone)}>
                  {d.available ? meta.label : "Sem dados"}
                </span>
              </div>
              <div className="mt-3 flex items-end justify-between">
                <span className="font-display text-3xl font-bold tracking-tight">{d.available ? Math.round(d.score) : "—"}</span>
                {d.available && <span className="text-[11px] text-muted-foreground">/ 100</span>}
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${d.available ? d.score : 0}%` }}
                  transition={{ duration: 0.9, ease: m.ease.enter, delay: 0.4 + i * 0.06 }}
                  className={cn("h-full rounded-full", meta.bar)}
                />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{d.headline}</p>
            </motion.article>
          );
        })}
      </div>
    </motion.section>
  );
}
