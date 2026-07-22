import { createFileRoute } from "@tanstack/react-router";
import { PlannedModule } from "@/components/planned-module";
import { getModule } from "@/lib/modules";

const mod = getModule("settings")!;

export const Route = createFileRoute("/_shell/settings")({
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
        "Organização, usuários, permissões e políticas",
        "Canais conectados, integrações e credenciais criptografadas",
        "Configuração de pipeline, serviços e automações",
        "Auditoria de segurança e sessões ativas",
      ]}
    />
  ),
});
