import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { motion as m } from "@/lib/motion";
import { JourneyRail } from "@/components/dashboard/journey-rail";
import { ExecutiveCards } from "@/components/dashboard/executive-cards";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { PrioritiesPanel } from "@/components/dashboard/priorities-panel";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { OperationsHealth } from "@/components/dashboard/operations-health";
import { ChevronDown, CalendarRange } from "lucide-react";

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

      <JourneyRail />

      <ExecutiveCards />

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

function PeriodFilter() {
  return (
    <button className="flex shrink-0 items-center gap-2 rounded-lg border border-border/70 bg-surface/70 px-3 py-2 text-sm text-foreground transition-colors hover:border-lime/40">
      <CalendarRange className="h-4 w-4 text-lime" />
      <span>Últimos 30 dias</span>
      <ChevronDown className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}
