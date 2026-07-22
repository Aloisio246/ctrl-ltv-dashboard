import { createFileRoute } from "@tanstack/react-router";
import { PlannedModule } from "@/components/planned-module";
import { getModule } from "@/lib/modules";

const mod = getModule("reports")!;

export const Route = createFileRoute("/_shell/reports")({
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
        "Conversão por origem, canal, nicho, cidade e responsável",
        "Receita, margem e CAC por dimensão",
        "Retenção, churn e LTV realizado vs líquido",
        "Exports auditáveis e comparativos por período",
      ]}
    />
  ),
});
