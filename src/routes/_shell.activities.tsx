import { createFileRoute } from "@tanstack/react-router";
import { getModule } from "@/lib/modules";
import { API_BASE_URL, fetchActivities, type Activity } from "@/lib/api-client";
import { useEffect, useState } from "react";
import { CalendarClock, CheckCircle2, CircleAlert, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const mod = getModule("activities")!;

export const Route = createFileRoute("/_shell/activities")({
  head: () => ({
    meta: [
      { title: `${mod.label} · Ctrl LTV` },
      { name: "description", content: mod.description },
      { property: "og:title", content: `${mod.label} · Ctrl LTV` },
      { property: "og:description", content: mod.description },
    ],
  }),
  component: ActivitiesPage,
});

function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(Boolean(API_BASE_URL));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!API_BASE_URL) return;
    fetchActivities().then((result) => {
      if (result.ok) setActivities(result.data);
      else setError(result.error.message);
      setLoading(false);
    });
  }, []);

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <header>
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">CTRL LTV · OPERAÇÃO</div>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight md:text-4xl">{mod.label}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Agenda unificada de follow-ups, reuniões, propostas e cobranças.</p>
      </header>

      <section className="surface-card p-5 md:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight">Próximas atividades</h2>
            <p className="text-xs text-muted-foreground">Dados carregados pela API local do Ctrl LTV.</p>
          </div>
          {loading && <Loader2 className="h-4 w-4 animate-spin text-lime" />}
        </div>

        {error && <div className="rounded-lg border border-danger/30 bg-danger/10 p-4 text-sm text-danger">{error}</div>}
        {!loading && !error && activities.length === 0 && (
          <div className="rounded-xl border border-dashed border-border/70 p-8 text-center text-sm text-muted-foreground">Nenhuma atividade cadastrada.</div>
        )}
        <div className="grid gap-3 md:grid-cols-2">
          {activities.map((activity, index) => <ActivityCard key={activity.id} activity={activity} index={index} />)}
        </div>
      </section>
    </div>
  );
}

function ActivityCard({ activity, index }: { activity: Activity; index: number }) {
  const done = activity.status === "completed";
  return (
    <motion.article initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className="rounded-xl border border-border/60 bg-surface/60 p-4">
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-lime/10 text-lime ring-1 ring-lime/20">{done ? <CheckCircle2 className="h-4 w-4" /> : <CalendarClock className="h-4 w-4" />}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-medium text-foreground">{activity.title}</h3>
            <Badge variant="outline" className="capitalize">{activity.status}</Badge>
          </div>
          {activity.notes && <p className="mt-1 text-xs text-muted-foreground">{activity.notes}</p>}
          <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
            <CircleAlert className="h-3.5 w-3.5 text-lime" />
            {activity.dueAt ? new Date(activity.dueAt).toLocaleString("pt-BR") : "Sem prazo definido"}
          </div>
        </div>
      </div>
    </motion.article>
  );
}
