import { createFileRoute } from "@tanstack/react-router";
import { PlannedModule } from "@/components/planned-module";
import { getModule } from "@/lib/modules";

const mod = getModule("finance")!;

export const Route = createFileRoute("/_shell/finance")({
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
        "Contratos, cobranças, pagamentos e custos por cliente",
        "MRR, receita recebida, ticket médio e inadimplência",
        "Receita da agência separada da verba de anúncios",
        "Margem por cliente, serviço e origem",
      ]}
    />
  ),
});
