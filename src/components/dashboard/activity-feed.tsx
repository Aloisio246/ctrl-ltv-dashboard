import { motion } from "framer-motion";
import type { DashboardSummary } from "@/lib/api-client";
import { motion as m, fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

type ActivityEvent = DashboardSummary["recentActivity"][number];
const toneDot: Record<ActivityEvent["tone"], string> = {
  neutral: "bg-muted-foreground",
  positive: "bg-lime",
  warning: "bg-warning",
  negative: "bg-danger",
};

import { parseDate, formatDate } from "@/lib/format";

function relativeTime(value: string | number | Date | null | undefined) {
  const date = parseDate(value);
  if (!date) return "—";
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60_000));
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  // reuse safe formatter
  return formatDate(date);
}

export function ActivityFeed({ data: activity }: { data: DashboardSummary["recentActivity"] }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: m.duration.slow, ease: m.ease.enter, delay: 0.26 }}
      className="surface-card p-5 md:p-6"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight">Atividade recente</h2>
          <p className="text-xs text-muted-foreground">Eventos do time e do sistema</p>
        </div>
      </div>

      <ol className="relative flex flex-col gap-4 pl-4">
        {activity.length === 0 && (
          <li className="text-sm text-muted-foreground">Nenhuma atividade registrada.</li>
        )}
        <span className="pointer-events-none absolute left-[7px] top-1 bottom-1 w-px bg-border/70" />
        {activity.map((event, i) => (
          <motion.li
            key={event.id}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{
              duration: m.duration.base,
              ease: m.ease.enter,
              delay: 0.32 + i * m.stagger.tight,
            }}
            className="relative"
          >
            <span
              className={cn(
                "absolute -left-4 top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-background",
                toneDot[event.tone],
              )}
            />
            <div className="text-sm">
              <span className="font-medium text-foreground">{event.actor}</span>{" "}
              <span className="text-muted-foreground">{event.action}</span>{" "}
              <span className="text-foreground">{event.target}</span>
            </div>
            <div className="text-[11px] text-muted-foreground">{relativeTime(event.createdAt)}</div>
          </motion.li>
        ))}
      </ol>
    </motion.section>
  );
}
