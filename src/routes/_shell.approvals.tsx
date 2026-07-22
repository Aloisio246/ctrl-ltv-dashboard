import { createFileRoute } from "@tanstack/react-router";
import { PlannedModule } from "@/components/planned-module";
import { getModule } from "@/lib/modules";

const mod = getModule("approvals")!;

export const Route = createFileRoute("/_shell/approvals")({
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
        "Lotes por campanha, canal e conta remetente",
        "Revisão item a item com conteúdo, versão e alertas de elegibilidade",
        "Aprovar autoriza envio futuro — não dispara na hora",
        "Kill switch por organização pausa todos os envios",
      ]}
    />
  ),
});
