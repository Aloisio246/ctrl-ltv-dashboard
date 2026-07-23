import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, Sparkles } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MODULES } from "@/lib/modules";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Close automatically on route change.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Abrir menu de navegação"
          className="grid h-10 w-10 place-items-center rounded-lg border border-border/60 bg-surface/60 text-muted-foreground transition-colors hover:border-lime/40 hover:text-foreground md:hidden"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[280px] border-sidebar-border bg-sidebar p-0 text-sidebar-foreground"
      >
        <SheetHeader className="border-b border-sidebar-border px-4 py-4 text-left">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-lime text-lime-foreground shadow-sm">
              <Sparkles className="h-4.5 w-4.5" strokeWidth={2.5} />
            </div>
            <div className="min-w-0 leading-tight">
              <SheetTitle className="font-display text-[15px] font-bold tracking-[0.14em]">
                CTRL LTV
              </SheetTitle>
              <SheetDescription className="truncate text-[11px] text-muted-foreground">
                Growth Operating System
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>
        <nav aria-label="Navegação principal" className="flex-1 overflow-y-auto px-2 py-3">
          <ul className="flex flex-col gap-0.5">
            {MODULES.map((mod) => {
              const active = pathname === mod.to;
              const Icon = mod.icon;
              return (
                <li key={mod.key}>
                  <Link
                    to={mod.to as string as never}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm outline-none transition-colors",
                      "hover:bg-sidebar-accent/70 focus-visible:ring-2 focus-visible:ring-ring",
                      active
                        ? "bg-sidebar-accent text-foreground ring-1 ring-inset ring-lime/25"
                        : "text-sidebar-foreground/80 hover:text-foreground",
                    )}
                  >
                    {active && (
                      <span
                        className="absolute left-0 top-1/2 h-5 -translate-y-1/2 rounded-r-full bg-lime"
                        style={{ width: 3 }}
                      />
                    )}
                    <Icon
                      className={cn(
                        "h-4.5 w-4.5 shrink-0",
                        active ? "text-lime" : "text-sidebar-foreground/60 group-hover:text-foreground",
                      )}
                      strokeWidth={2}
                    />
                    <span className="truncate">{mod.label}</span>
                    {mod.phase === "planned" && (
                      <span className="ml-auto rounded-full border border-border/60 bg-background/30 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        em breve
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
