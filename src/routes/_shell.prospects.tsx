import { createFileRoute } from "@tanstack/react-router";
import { PlannedModule } from "@/components/planned-module";
import { getModule } from "@/lib/modules";

const mod = getModule("prospects")!;

export const Route = createFileRoute("/_shell/prospects")({
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
        "Lista filtrável por score, origem, canal, cidade e responsável",
        "Perfil completo com empresa, contatos e identidades",
        "Próxima ação recomendada e canais elegíveis por prospect",
        "Conversão sem recadastro em oportunidade e cliente",
      ]}
    />
  ),
});
