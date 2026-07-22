import { motion } from "framer-motion";
import { motion as m } from "@/lib/motion";
import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function PlannedModule({
  title,
  description,
  icon,
  bullets,
}: {
  title: string;
  description: string;
  icon?: ReactNode;
  bullets: string[];
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: m.duration.slow, ease: m.ease.enter }}
        className="surface-card p-8 md:p-10"
      >
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-lime/15 text-lime ring-1 ring-lime/25">
            {icon ?? <Sparkles className="h-5 w-5" />}
          </div>
          <span className="rounded-full border border-lime/30 bg-lime/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-lime">
            Planejado para a próxima fase
          </span>
        </div>
        <h1 className="mt-5 font-display text-3xl font-bold tracking-tight md:text-4xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
          {description}
        </p>

        <div className="mt-6 rounded-xl border border-border/60 bg-surface/60 p-5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            O que este módulo entregará
          </div>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-lime" />
                <span className="text-foreground/90">{b}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <Link
            to="/dashboard"
            className="rounded-md border border-border/70 bg-background/50 px-3 py-1.5 text-foreground hover:border-lime/40"
          >
            Voltar ao dashboard
          </Link>
          <span className="rounded-md border border-border/60 bg-surface/60 px-3 py-1.5">
            Nenhum backend conectado nesta fase
          </span>
        </div>
      </motion.div>
    </div>
  );
}
