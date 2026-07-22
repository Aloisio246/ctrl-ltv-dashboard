import { createFileRoute } from "@tanstack/react-router";
import { PlannedModule } from "@/components/planned-module";
import { getModule } from "@/lib/modules";

const mod = getModule("capture")!;

export const Route = createFileRoute("/_shell/capture")({
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
        "Conectores para Google Maps, Apify, Serper, CSV e formulários",
        "Execuções auditáveis com contadores por estágio em tempo real",
        "Normalização, deduplicação e enriquecimento antes da prospecção",
        "Score explicável e aprovação humana para virar prospect",
      ]}
    />
  ),
});
