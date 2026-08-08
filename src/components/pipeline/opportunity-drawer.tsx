import { Link } from "@tanstack/react-router";
import { CalendarClock, Contact as ContactIcon, MessagesSquare } from "lucide-react";
import type { PipelineStage } from "@/lib/api-client";
import type { OpportunityView } from "@/lib/pipeline-view";
import { formatCurrency, activityTypeLabel } from "@/lib/pipeline-view";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { AppSelect } from "@/components/ui/app-select";
import { formatDate, formatDateTime } from "@/lib/format";

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 truncate text-sm text-foreground">{value?.trim() || "—"}</dd>
    </div>
  );
}

/**
 * Consulta rápida da oportunidade sem sair do Kanban.
 * Só exibe dados que a API já devolve; atalhos usam busca por nome/telefone,
 * porque a API ainda não expõe vínculo direto Oportunidade ↔ Conversa.
 */
export function OpportunityDrawer({
  view,
  stages,
  moving,
  onOpenChange,
  onMove,
}: {
  view: OpportunityView | null;
  stages: PipelineStage[];
  moving: boolean;
  onOpenChange: (open: boolean) => void;
  onMove: (id: string, stageId: string) => void;
}) {
  const stage = view ? stages.find((item) => item.id === view.opportunity.stageId) : undefined;
  const inboxTerm = view?.title ?? "";
  const contactTerm = view?.contact?.name ?? view?.companyName ?? "";

  return (
    <Sheet open={Boolean(view)} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md">
        {view && (
          <>
            <SheetHeader className="text-left">
              <SheetTitle className="pr-8 font-display text-xl">{view.title}</SheetTitle>
              <SheetDescription>
                {view.subtitle || view.companyName || "Oportunidade em andamento"}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <StatusBadge label={stage?.name ?? "Etapa atual"} tone="info" />
              {view.temperature && <StatusBadge status={view.temperature} />}
              <span className="text-sm font-semibold text-lime">
                {formatCurrency(view.amount, view.currency)}
              </span>
            </div>

            <section className="mt-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Contato
              </h3>
              <dl className="mt-3 grid grid-cols-2 gap-3 rounded-lg border border-border/60 p-3">
                <Field label="Nome" value={view.contact?.name} />
                <Field label="Empresa" value={view.companyName} />
                <Field label="Telefone" value={view.phone} />
                <Field label="E-mail" value={view.email} />
              </dl>
            </section>

            <section className="mt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Oportunidade
              </h3>
              <dl className="mt-3 grid grid-cols-2 gap-3 rounded-lg border border-border/60 p-3">
                <Field label="Etapa" value={stage?.name} />
                <Field label="Valor" value={formatCurrency(view.amount, view.currency)} />
                <Field label="Responsável" value={view.ownerLabel ?? "Não atribuído"} />
                <Field label="Origem" value={view.source} />
                <Field label="Previsão" value={formatDate(view.expectedCloseAt)} />
                <Field
                  label="Score"
                  value={view.score !== null ? String(view.score) : undefined}
                />
              </dl>
            </section>

            <section className="mt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Próxima ação
              </h3>
              {view.nextActivity ? (
                <div className="mt-3 rounded-lg border border-border/60 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 text-sm font-medium">{view.nextActivity.title}</p>
                    <StatusBadge label={activityTypeLabel(view.nextActivity.type)} tone="neutral" />
                  </div>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarClock aria-hidden="true" className="h-3.5 w-3.5" />
                    {formatDateTime(view.nextActivity.dueAt, "sem prazo definido")}
                  </p>
                  {view.nextActivityTiming?.tone === "danger" && (
                    <StatusBadge
                      className="mt-2"
                      label={view.nextActivityTiming.label}
                      tone="danger"
                    />
                  )}
                </div>
              ) : (
                <p className="mt-3 rounded-lg border border-dashed border-border/60 p-3 text-xs text-muted-foreground">
                  Nenhuma atividade pendente registrada para esta oportunidade.
                </p>
              )}
            </section>

            <section className="mt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Mover para etapa
              </h3>
              <AppSelect
                ariaLabel={`Etapa de ${view.title}`}
                className="mt-3"
                disabled={moving}
                value={view.opportunity.stageId}
                onValueChange={(value) => onMove(view.opportunity.id, value)}
                options={stages.map((item) => ({ value: item.id, label: item.name }))}
              />
            </section>

            <section className="mt-5 flex flex-col gap-2 pb-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Atalhos
              </h3>
              <Button asChild variant="outline" className="justify-start">
                <Link to="/contacts" search={{ q: contactTerm }}>
                  <ContactIcon aria-hidden="true" className="mr-2 h-4 w-4" /> Abrir contato
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link to="/inbox" search={{ q: inboxTerm }}>
                  <MessagesSquare aria-hidden="true" className="mr-2 h-4 w-4" /> Conversar
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link to="/activities" search={{ q: contactTerm }}>
                  <CalendarClock aria-hidden="true" className="mr-2 h-4 w-4" /> Ver atividades
                </Link>
              </Button>
              <p className="text-[11px] text-muted-foreground">
                Os atalhos abrem a tela correspondente já filtrada pelo nome. O vínculo direto com a
                conversa depende de a API expor o identificador da conversa do contato.
              </p>
            </section>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
