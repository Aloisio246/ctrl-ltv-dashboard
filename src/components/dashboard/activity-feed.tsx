import { motion } from "framer-motion";
import { activity, type ActivityEvent } from "@/lib/mock/dashboard";
import { motion as m, fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

const toneDot: Record<ActivityEvent["tone"], string> = {
  neutral: "bg-muted-foreground",
  positive: "bg-lime",
  warning: "bg-warning",
  negative: "bg-danger",
};

export function ActivityFeed() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: m.duration.slow, ease: m.ease.enter, delay: 0.26 }}
      className="surface-card p-5 md:p-6"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight">
            Atividade recente
          </h2>
          <p className="text-xs text-muted-foreground">Eventos do time e do sistema</p>
        </div>
      </div>

      <ol className="relative flex flex-col gap-4 pl-4">
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
            <div className="text-[11px] text-muted-foreground">{event.at}</div>
          </motion.li>
        ))}
      </ol>
    </motion.section>
  );
}
