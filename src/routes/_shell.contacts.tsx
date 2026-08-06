import { createFileRoute, redirect } from "@tanstack/react-router";

// Rota legada: contatos e empresas passaram a ser entidades internas de Prospects.
export const Route = createFileRoute("/_shell/contacts")({
  beforeLoad: () => {
    throw redirect({ to: "/prospects" });
  },
});
