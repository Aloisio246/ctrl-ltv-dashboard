import { motion } from "framer-motion";
import type { DashboardSummary } from "@/lib/api-client";
import { motion as m, fadeUp } from "@/lib/motion";
import { AlarmClock, ShieldCheck, CalendarCheck, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type Priority = DashboardSummary["priorities"][number];
const kindMeta: Record<
  Priority["kind"],
  { icon: React.ComponentType<{ className?: string }>; label: string }
> = {
  followup: { icon: AlarmClock, label: "Follow-up" },
  approval: { icon: ShieldCheck, label: "Aprovação" },
  risk: { icon: AlertTriangle, label: "Risco" },
};

const sevStyle: Record<Priority["severity"], string> = {
  medium: "bg-warning/10 text-warning ring-warning/25",
  high: "bg-danger/10 text-danger ring-danger/25",
};

import { parseDate, formatDate } from "@/lib/format";

function dueLabel(value: string | number | Date | null | undefined) {
  const due = parseDate(value);
  if (!due) return "—";
  const diffDays = Math.ceil((due.getTime() - Date.now()) / 86_400_000);
  if (diffDays < 0) return `Atrasado ${Math.abs(diffDays)}d`;
  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Amanhã";
  return formatDate(due);
}

export function PrioritiesPanel({ data: priorities }: { data: DashboardSummary["priorities"] }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: m.duration.slow, ease: m.ease.enter, delay: 0.22 }}
      className="surface-card flex flex-col p-5 md:p-6"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight">Prioridades de hoje</h2>
          <p className="text-xs text-muted-foreground">
            Follow-ups, aprovações, reuniões e riscos que exigem ação
          </p>
        </div>
        <span className="rounded-full bg-lime/10 px-2 py-1 text-[10px] font-semibold text-lime ring-1 ring-lime/25">
          {priorities.length} itens
        </span>
      </div>

      <ul className="flex flex-col gap-2">
        {priorities.length === 0 && (
          <li className="rounded-lg border border-border/60 p-6 text-center text-sm text-muted-foreground">
            Nenhuma prioridade pendente.
          </li>
        )}
        {priorities.map((p, i) => {
          const meta = kindMeta[p.kind];
          const Icon = meta.icon;
          return (
            <motion.li
              key={p.id}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              transition={{
                duration: m.duration.base,
                ease: m.ease.enter,
                delay: 0.28 + i * m.stagger.tight,
              }}
              className="group flex items-start gap-3 rounded-lg border border-border/60 bg-surface/50 p-3 transition-colors hover:border-lime/30"
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-2 text-muted-foreground group-hover:text-lime">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {meta.label}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1",
                      sevStyle[p.severity],
                    )}
                  >
                    {dueLabel(p.dueAt)}
                  </span>
                </div>
                <div className="mt-0.5 truncate text-sm font-medium text-foreground">{p.title}</div>
                <div className="truncate text-xs text-muted-foreground">{p.subtitle}</div>
              </div>
            </motion.li>
          );
        })}
      </ul>
    </motion.section>
  );
}
