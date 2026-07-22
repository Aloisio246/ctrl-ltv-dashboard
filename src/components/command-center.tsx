import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { MODULES } from "@/lib/modules";
import { Plus, FileCheck, MessageSquarePlus, Calendar } from "lucide-react";

type Ctx = { open: () => void; close: () => void; toggle: () => void };
const CommandCenterContext = createContext<Ctx | null>(null);

export function useCommandCenter() {
  const ctx = useContext(CommandCenterContext);
  if (!ctx) throw new Error("useCommandCenter must be used within CommandCenterProvider");
  return ctx;
}

export function CommandCenterProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const value = useMemo<Ctx>(
    () => ({
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      toggle: () => setIsOpen((v) => !v),
    }),
    [],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = useCallback(
    (to: string) => {
      setIsOpen(false);
      navigate({ to: to as never });
    },
    [navigate],
  );

  return (
    <CommandCenterContext.Provider value={value}>
      {children}
      <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
        <CommandInput placeholder="Buscar módulos, prospects, clientes, ações…" />
        <CommandList>
          <CommandEmpty>Nada encontrado.</CommandEmpty>
          <CommandGroup heading="Ir para">
            {MODULES.map((m) => (
              <CommandItem key={m.key} value={m.label} onSelect={() => go(m.to)}>
                <m.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{m.label}</span>
                <span className="ml-auto text-[10px] text-muted-foreground">
                  {m.phase === "live" ? "ativo" : "em breve"}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Ações rápidas">
            <CommandItem onSelect={() => go("/capture")}>
              <Plus className="mr-2 h-4 w-4 text-lime" />
              Nova execução de captação
            </CommandItem>
            <CommandItem onSelect={() => go("/approvals")}>
              <FileCheck className="mr-2 h-4 w-4 text-lime" />
              Revisar lotes pendentes
            </CommandItem>
            <CommandItem onSelect={() => go("/inbox")}>
              <MessageSquarePlus className="mr-2 h-4 w-4 text-lime" />
              Abrir caixa de entrada
            </CommandItem>
            <CommandItem onSelect={() => go("/activities")}>
              <Calendar className="mr-2 h-4 w-4 text-lime" />
              Agenda de hoje
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </CommandCenterContext.Provider>
  );
}
