import { createFileRoute, redirect } from "@tanstack/react-router";

// Rota legada: solicitações de acesso são tratadas dentro de Configurações.
export const Route = createFileRoute("/_shell/access-requests")({
  beforeLoad: () => {
    throw redirect({ to: "/settings" });
  },
});
