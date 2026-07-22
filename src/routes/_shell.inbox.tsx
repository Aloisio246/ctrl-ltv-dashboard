import { createFileRoute } from "@tanstack/react-router";
import { PlannedModule } from "@/components/planned-module";
import { getModule } from "@/lib/modules";

const mod = getModule("inbox")!;

export const Route = createFileRoute("/_shell/inbox")({
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
        "Caixa unificada de WhatsApp, Instagram, e-mail, Messenger e chat",
        "Contexto completo do prospect ao lado da conversa",
        "Estados de envio: enviando, enviado, entregue, lido e falhou",
        "Stop-on-reply cancela follow-ups pendentes automaticamente",
      ]}
    />
  ),
});
