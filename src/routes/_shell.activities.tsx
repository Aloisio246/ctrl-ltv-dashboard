import { createFileRoute } from "@tanstack/react-router";
import { PlannedModule } from "@/components/planned-module";
import { getModule } from "@/lib/modules";

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
  component: () => (
    <PlannedModule
      title={mod.label}
      description={mod.description}
      icon={<mod.icon className="h-5 w-5" />}
      bullets={[
        "Agenda unificada de follow-ups, reuniões, propostas e cobranças",
        "Vinculação clara a prospect, oportunidade ou cliente",
        "Lembretes e SLA por tipo de atividade",
        "Histórico auditável de cada interação",
      ]}
    />
  ),
});
