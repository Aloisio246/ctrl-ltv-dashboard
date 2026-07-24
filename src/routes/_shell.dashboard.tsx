import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { motion as m } from "@/lib/motion";
import { JourneyRail } from "@/components/dashboard/journey-rail";
import { ExecutiveCards } from "@/components/dashboard/executive-cards";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { PrioritiesPanel } from "@/components/dashboard/priorities-panel";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { OperationsHealth } from "@/components/dashboard/operations-health";
import { ChevronDown, CalendarRange, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { API_BASE_URL, fetchDashboardSummary, type DashboardSummary } from "@/lib/api-client";
import type { JourneyStage, MetricCard } from "@/lib/mock/dashboard";

export const Route = createFileRoute("/_shell/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard · Ctrl LTV" },
      {
        name: "description",
        content:
          "Visão executiva do Ctrl LTV: captação, prospecção, negociação, clientes, receita, retenção e LTV em uma tela.",
      },
      { property: "og:title", content: "Dashboard · Ctrl LTV" },
      {
        property: "og:description",
        content:
          "Painel executivo para acompanhar toda a jornada do cliente até o LTV.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(Boolean(API_BASE_URL));

  useEffect(() => {
    if (!API_BASE_URL) return;
    fetchDashboardSummary().then((result) => {
      if (result.ok) setSummary(result.data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <motion.header
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: m.duration.base, ease: m.ease.enter }}
        className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:flex sm:flex-wrap sm:justify-between"
      >
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            CTRL LTV · GROWTH OS
          </div>
          <h1 className="mt-1 truncate font-display text-3xl font-bold tracking-tight md:text-4xl">
            Visão geral
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Como está a jornada de aquisição, receita e retenção agora.
          </p>
        </div>
        <PeriodFilter />
      </motion.header>

      {loading && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Conectando ao backend local…</div>}
      <JourneyRail data={summary ? toJourney(summary) : undefined} />

      <ExecutiveCards data={summary ? toMetrics(summary) : undefined} />

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RevenueChart />
        </div>
        <PrioritiesPanel />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <OperationsHealth />
        </div>
        <ActivityFeed />
      </div>
    </div>
  );
}

function toMetrics(summary: DashboardSummary): MetricCard[] {
  const pipelineCount = summary.pipeline.reduce((total, item) => total + item.count, 0);
  return [
    { key: "captured", label: "Oportunidades captadas", value: summary.capture.totalRecords, format: "number", delta: 0, hint: "no período" },
    { key: "prospects", label: "Prospects ativos", value: pipelineCount, format: "number", delta: 0, hint: "no pipeline" },
    { key: "deals", label: "Negociações abertas", value: summary.pipeline.filter((item) => ["proposal", "negotiation"].includes(item.status)).reduce((total, item) => total + item.count, 0), format: "number", delta: 0, hint: "em negociação" },
    { key: "clients", label: "Clientes ativos", value: summary.metrics.activeClients, format: "number", delta: 0, hint: "com contrato vigente" },
    { key: "mrr", label: "MRR", value: Number(summary.metrics.mrr), format: "currency", delta: 0, hint: "receita recorrente" },
    { key: "revenue", label: "Receita recebida", value: Number(summary.metrics.realizedRevenue), format: "currency", delta: 0, hint: "receita realizada" },
    { key: "ticket", label: "Margem", value: summary.metrics.margin, format: "currency", delta: 0, hint: "receita menos custos" },
    { key: "ltv", label: "LTV médio", value: summary.metrics.averageLtv, format: "currency", delta: 0, hint: "realizado por cliente" },
  ];
}

function toJourney(summary: DashboardSummary): JourneyStage[] {
  const count = (statuses: string[]) => summary.pipeline.filter((item) => statuses.includes(item.status)).reduce((total, item) => total + item.count, 0);
  return [
    { key: "capture", label: "Captação", count: summary.capture.totalRecords, conversion: null, hint: "registros captados" },
    { key: "prospecting", label: "Prospecção", count: count(["new", "contacted", "qualified"]), conversion: null, hint: "prospects no funil" },
    { key: "negotiation", label: "Negociação", count: count(["proposal", "negotiation"]), conversion: null, hint: "oportunidades abertas" },
    { key: "client", label: "Cliente", count: summary.metrics.activeClients, conversion: null, hint: "clientes ativos" },
    { key: "revenue", label: "Receita", count: Number(summary.metrics.realizedRevenue) > 0 ? 1 : 0, conversion: null, hint: "com faturamento" },
    { key: "retention", label: "Retenção", count: summary.metrics.activeClients - summary.metrics.cancelledThisMonth, conversion: null, hint: "sem cancelamento no mês" },
    { key: "ltv", label: "LTV", count: summary.metrics.averageLtv > 0 ? summary.metrics.activeClients : 0, conversion: null, hint: "com LTV calculado" },
  ];
}

function PeriodFilter() {
  return (
    <button className="flex shrink-0 items-center gap-2 rounded-lg border border-border/70 bg-surface/70 px-3 py-2 text-sm text-foreground transition-colors hover:border-lime/40">
      <CalendarRange className="h-4 w-4 text-lime" />
      <span>Últimos 30 dias</span>
      <ChevronDown className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}
