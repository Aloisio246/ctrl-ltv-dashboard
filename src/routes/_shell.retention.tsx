import { createFileRoute } from "@tanstack/react-router";
import { PlannedModule } from "@/components/planned-module";
import { getModule } from "@/lib/modules";

const mod = getModule("retention")!;

export const Route = createFileRoute("/_shell/retention")({
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
        "Saúde do cliente com estados saudável, atenção, risco e crítico",
        "Renovações próximas e oportunidades de upsell",
        "Playbooks para reversão de risco",
        "Snapshots de LTV e histórico de churn",
      ]}
    />
  ),
});
