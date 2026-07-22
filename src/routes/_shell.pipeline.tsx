import { createFileRoute } from "@tanstack/react-router";
import { PlannedModule } from "@/components/planned-module";
import { getModule } from "@/lib/modules";

const mod = getModule("pipeline")!;

export const Route = createFileRoute("/_shell/pipeline")({
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
        "Kanban comercial com etapas canônicas do Growth OS",
        "Drag-and-drop com validações e retorno em caso de erro",
        "Motivo de perda estruturado e ganho gera cliente automaticamente",
        "SLA por etapa, follow-ups e alertas de inatividade",
      ]}
    />
  ),
});
