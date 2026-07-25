import {
  LayoutDashboard,
  Radar,
  Users,
  KanbanSquare,
  MessagesSquare,
  ShieldCheck,
  CalendarClock,
  Building2,
  Wallet,
  HeartPulse,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type ModuleDef = {
  key: string;
  label: string;
  description: string;
  to: string;
  icon: LucideIcon;
  phase: "live" | "planned";
};

export const MODULES: ModuleDef[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    description: "Visão executiva da operação de aquisição, receita e retenção.",
    to: "/dashboard",
    icon: LayoutDashboard,
    phase: "live",
  },
  {
    key: "capture",
    label: "Captação",
    description: "Fontes, execuções e resultados brutos antes de virarem prospects.",
    to: "/capture",
    icon: Radar,
    phase: "live",
  },
  {
    key: "prospects",
    label: "Prospects",
    description: "Base qualificada com score, canal elegível e próxima ação.",
    to: "/prospects",
    icon: Users,
    phase: "live",
  },
  {
    key: "pipeline",
    label: "Pipeline",
    description: "Kanban comercial da negociação até o ganho.",
    to: "/pipeline",
    icon: KanbanSquare,
    phase: "live",
  },
  {
    key: "inbox",
    label: "Conversas",
    description: "Caixa de entrada omnichannel unificada por prospect.",
    to: "/inbox",
    icon: MessagesSquare,
    phase: "live",
  },
  {
    key: "approvals",
    label: "Aprovações",
    description: "Lotes de comunicação preparados aguardando revisão.",
    to: "/approvals",
    icon: ShieldCheck,
    phase: "live",
  },
  {
    key: "activities",
    label: "Atividades",
    description: "Follow-ups, reuniões, propostas e tarefas do time.",
    to: "/activities",
    icon: CalendarClock,
    phase: "live",
  },
  {
    key: "clients",
    label: "Clientes",
    description: "Empresas ativas, serviços contratados e histórico.",
    to: "/clients",
    icon: Building2,
    phase: "live",
  },
  {
    key: "finance",
    label: "Financeiro",
    description: "Contratos, cobranças, pagamentos, custos e MRR.",
    to: "/finance",
    icon: Wallet,
    phase: "live",
  },
  {
    key: "retention",
    label: "Retenção",
    description: "Saúde, riscos, renovações e churn dos clientes.",
    to: "/retention",
    icon: HeartPulse,
    phase: "live",
  },
  {
    key: "reports",
    label: "Relatórios",
    description: "Conversão, receita, margem, CAC e LTV por dimensão.",
    to: "/reports",
    icon: BarChart3,
    phase: "live",
  },
  {
    key: "settings",
    label: "Configurações",
    description: "Organização, usuários, canais, integrações e políticas.",
    to: "/settings",
    icon: Settings,
    phase: "planned",
  },
];

export const getModule = (key: string) => MODULES.find((m) => m.key === key);
