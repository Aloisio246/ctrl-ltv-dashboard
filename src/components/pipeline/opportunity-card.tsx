import { memo } from "react";
import { ArrowRightLeft, Building2, Loader2, Phone, User } from "lucide-react";
import type { DragEvent } from "react";
import type { PipelineStage } from "@/lib/api-client";
import type { OpportunityView } from "@/lib/pipeline-view";
import { formatCurrency } from "@/lib/pipeline-view";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type Props = {
  view: OpportunityView;
  stages: PipelineStage[];
  moving: boolean;
  dragging: boolean;
  onOpen: (id: string) => void;
  onMove: (id: string, stageId: string) => void;
  onDragStart: (event: DragEvent<HTMLElement>, id: string) => void;
  onDragEnd: () => void;
};

function OpportunityCardBase({
  view,
  stages,
  moving,
  dragging,
  onOpen,
  onMove,
  onDragStart,
  onDragEnd,
}: Props) {
  const { opportunity } = view;

  return (
    <article
      draggable={!moving}
      onDragStart={(event) => onDragStart(event, opportunity.id)}
      onDragEnd={onDragEnd}
      className={cn(
        "group rounded-lg border border-border/60 bg-background/70 p-3 transition-all",
        "hover:border-lime/40 hover:shadow-[0_6px_20px_-12px_rgba(0,0,0,0.9)]",
        dragging && "rotate-[0.4deg] scale-[1.02] border-lime/60 opacity-70 shadow-lg",
        moving && "pointer-events-none opacity-60",
        !moving && "cursor-grab active:cursor-grabbing",
      )}
    >
      <button
        type="button"
        onClick={() => onOpen(opportunity.id)}
        className="w-full rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Abrir detalhes de ${view.title}`}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 truncate text-sm font-semibold text-foreground">{view.title}</p>
          {moving && <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin text-lime" />}
        </div>
        <p className="mt-0.5 flex min-w-0 items-center gap-1 truncate text-[11px] text-muted-foreground">
          {view.subtitle ? (
            <>
              <Building2 aria-hidden="true" className="h-3 w-3 shrink-0" />
              <span className="truncate">{view.subtitle}</span>
            </>
          ) : view.phone ? (
            <>
              <Phone aria-hidden="true" className="h-3 w-3 shrink-0" />
              <span className="truncate">{view.phone}</span>
            </>
          ) : (
            <span className="truncate">Sem dados de contato</span>
          )}
        </p>

        <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
          <span className="font-semibold text-lime">
            {formatCurrency(view.amount, view.currency)}
          </span>
          <span className="flex min-w-0 items-center justify-end gap-1 text-muted-foreground">
            {view.ownerLabel && (
              <>
                <User aria-hidden="true" className="h-3 w-3 shrink-0" />
                <span className="truncate">{view.ownerLabel}</span>
              </>
            )}
          </span>
          <span className="truncate text-muted-foreground">
            {view.source ? `Origem: ${view.source}` : "Origem não informada"}
          </span>
          <span className="truncate text-right text-muted-foreground">
            {view.nextActivityTiming ? view.nextActivityTiming.label : "Sem próxima ação"}
          </span>
        </div>

        {(view.temperature || view.nextActivityTiming?.tone === "danger") && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {view.nextActivityTiming?.tone === "danger" && (
              <StatusBadge label={view.nextActivityTiming.label} tone="danger" />
            )}
            {view.temperature && <StatusBadge status={view.temperature} />}
          </div>
        )}
      </button>

      <div className="mt-2.5 flex items-center justify-end border-t border-border/40 pt-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              disabled={moving}
              className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <ArrowRightLeft aria-hidden="true" className="mr-1 h-3.5 w-3.5" /> Mover para etapa
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="text-xs">Escolha a etapa</DropdownMenuLabel>
            {stages.map((stage) => (
              <DropdownMenuItem
                key={stage.id}
                disabled={stage.id === opportunity.stageId}
                onSelect={() => onMove(opportunity.id, stage.id)}
              >
                {stage.name}
                {stage.id === opportunity.stageId && (
                  <span className="ml-auto text-[10px] text-muted-foreground">atual</span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </article>
  );
}

export const OpportunityCard = memo(OpportunityCardBase);
