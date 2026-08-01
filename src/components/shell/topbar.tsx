import { Bell, Search, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion as m } from "@/lib/motion";
import { useCommandCenter } from "@/components/command-center";
import { MobileNav } from "@/components/shell/mobile-nav";
import { fetchDashboardSummary, logout, type DashboardSummary } from "@/lib/api-client";

export function Topbar() {
  const { open } = useCommandCenter();
  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    fetchDashboardSummary().then((result) => {
      if (result.ok) setSummary(result.data);
    });
  }, []);

  const overdueCount = summary?.priorities.filter((item) => item.kind === "risk").length ?? 0;
  const unreadCount = summary?.inbox.unreadMessages ?? 0;
  const approvalCount = summary?.approvals.pendingItems ?? 0;
  const notificationCount = overdueCount + unreadCount + approvalCount;

  async function handleLogout() {
    await logout();
    window.location.assign("/dashboard");
  }

  return (
    <motion.header
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: m.duration.base, ease: m.ease.enter, delay: 0.08 }}
      className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-background/70 px-4 backdrop-blur-md md:px-6"
    >
      <MobileNav />

      <button
        onClick={open}
        aria-label="Abrir busca global"
        className="group flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-lg border border-border/70 bg-surface/70 px-3 text-left text-sm text-muted-foreground transition-colors hover:border-lime/40 hover:text-foreground md:max-w-md"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="truncate">Buscar prospects, clientes, ações…</span>
        <kbd className="ml-auto hidden shrink-0 rounded border border-border/70 bg-background/50 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground md:inline-block">
          {isMac ? "⌘" : "Ctrl"} K
        </kbd>
      </button>

      <button
        aria-label="Notificações"
        aria-expanded={notificationsOpen}
        onClick={() => setNotificationsOpen((current) => !current)}
        className="relative grid h-10 w-10 place-items-center rounded-lg border border-border/60 bg-surface/60 text-muted-foreground transition-colors hover:border-lime/40 hover:text-foreground"
      >
        <Bell className="h-4 w-4" />
        {notificationCount > 0 && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-lime" />}
      </button>
      {notificationsOpen && (
        <div className="absolute right-28 top-14 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-border bg-surface p-3 shadow-2xl">
          <div className="border-b border-border/60 px-2 pb-2">
            <div className="text-sm font-semibold">Notificações</div>
            <div className="text-xs text-muted-foreground">
              {notificationCount ? `${notificationCount} itens exigem atenção` : "Nenhuma pendência agora"}
            </div>
          </div>
          <div className="mt-2 grid gap-1">
            <NotificationLink to="/inbox" label="Mensagens não lidas" count={unreadCount} onClick={() => setNotificationsOpen(false)} />
            <NotificationLink to="/approvals" label="Aprovações pendentes" count={approvalCount} onClick={() => setNotificationsOpen(false)} />
            <NotificationLink to="/finance" label="Cobranças vencidas" count={overdueCount} onClick={() => setNotificationsOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-surface/60 px-2 py-1.5">
        <div className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-lime to-violet text-[11px] font-bold text-lime-foreground">
          AI
        </div>
        <div className="hidden leading-tight sm:block">
          <div className="text-xs font-medium">Aloisio Isidio</div>
          <div className="text-[10px] text-muted-foreground">Ctrl LTV</div>
        </div>
      </div>

      <button
        aria-label="Sair da conta"
        onClick={handleLogout}
        className="grid h-10 w-10 place-items-center rounded-lg border border-border/60 bg-surface/60 text-muted-foreground transition-colors hover:border-lime/40 hover:text-foreground"
        title="Sair"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </motion.header>
  );
}

function NotificationLink({
  to,
  label,
  count,
  onClick,
}: {
  to: "/inbox" | "/approvals" | "/finance";
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center justify-between rounded-lg px-2 py-2 text-sm transition-colors hover:bg-surface-2"
    >
      <span>{label}</span>
      <span className="rounded-full bg-lime/10 px-2 py-0.5 text-xs font-semibold text-lime">{count}</span>
    </Link>
  );
}
