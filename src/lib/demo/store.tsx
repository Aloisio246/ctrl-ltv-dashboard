import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { RUN_STAGES, STAGE_LABEL } from "./catalog";
import {
  DEMO_STORAGE_KEY,
  DEMO_VERSION,
  buildRecord,
  computeScore,
  createSeedState,
  dedupeKeys,
  demoId,
  generateRecordsForRun,
} from "./seed";
import type {
  CaptureRecordDemo,
  CaptureRunDemo,
  CaptureSourceKey,
  DemoState,
  ProspectDemo,
  RunStage,
  TimelineEvent,
} from "./types";

const TICK_MS = 900;

export type CsvRow = {
  companyName: string;
  niche: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  website: string;
  instagram: string;
  contactName: string;
};

export type CsvImportSummary = { imported: number; duplicates: number; invalid: number };

type DemoContextValue = DemoState & {
  hydrated: boolean;
  startRun: (input: {
    source: CaptureSourceKey;
    query: string;
    limit: number;
    params: Array<{ label: string; value: string }>;
  }) => string;
  retryRun: (runId: string) => string | null;
  cancelRun: (runId: string) => void;
  importCsvRows: (rows: CsvRow[]) => CsvImportSummary;
  updateRecord: (id: string, patch: Partial<CaptureRecordDemo>) => void;
  approveRecords: (ids: string[]) => void;
  discardRecords: (ids: string[]) => void;
  promoteRecords: (ids: string[]) => number;
  assignRecords: (ids: string[], ownerId: string | null) => void;
  setRecordsService: (ids: string[], service: string) => void;
  mergeDuplicate: (keepId: string, duplicateId: string) => void;
  keepSeparate: (recordId: string) => void;
  createProspectManually: (input: {
    companyName: string;
    niche: string;
    city: string;
    state: string;
    phone: string;
    email: string;
    website: string;
    instagram: string;
    contactName: string;
    serviceInterest: string | null;
    ownerId: string | null;
  }) => void;
  updateProspect: (id: string, patch: Partial<ProspectDemo>) => void
  bulkUpdateProspects: (ids: string[], patch: Partial<ProspectDemo>) => void;
  scheduleFollowUp: (ids: string[], dueAtIso: string) => void;
  completeFollowUp: (prospectId: string) => void;
  addProspectNote: (prospectId: string, note: string) => void;
  addProspectTag: (ids: string[], tag: string) => void;
  archiveProspects: (ids: string[]) => void;
  resetDemoData: () => void;
};

const DemoContext = createContext<DemoContextValue | null>(null);

export function useDemoData(): DemoContextValue {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemoData deve ser usado dentro de DemoDataProvider");
  return ctx;
}

function readStored(): DemoState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DEMO_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DemoState;
    if (parsed.version !== DEMO_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

function nowIso() {
  return new Date().toISOString();
}

function pushTimeline(state: DemoState, event: Omit<TimelineEvent, "id">): TimelineEvent[] {
  return [{ ...event, id: demoId("tl") }, ...state.timeline];
}

export function DemoDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(() => createSeedState());
  const [hydrated, setHydrated] = useState(false);
  const skipPersist = useRef(true);

  useEffect(() => {
    const stored = readStored();
    if (stored) setState(stored);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (skipPersist.current) {
      skipPersist.current = false;
      return;
    }
    try {
      window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Persistência indisponível (modo privado). A sessão continua funcionando em memória.
    }
  }, [state, hydrated]);

  // Progressão controlada das execuções em andamento.
  const hasRunning = state.runs.some((run) => run.status === "running");
  useEffect(() => {
    if (!hasRunning) return;
    const timer = window.setInterval(() => {
      setState((current) => advanceRunningRuns(current));
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [hasRunning]);

  const startRun = useCallback<DemoContextValue["startRun"]>((input) => {
    const id = demoId("run");
    const startedAt = nowIso();
    setState((current) => ({
      ...current,
      runs: [
        {
          id,
          source: input.source,
          query: input.query,
          params: input.params,
          startedAt,
          finishedAt: null,
          status: "running",
          stage: "collecting",
          limit: input.limit,
          found: 0,
          accepted: 0,
          duplicates: 0,
          errors: 0,
          durationMs: 0,
          logs: [{ at: startedAt, stage: "collecting", message: `Consulta iniciada: ${input.query}` }],
        },
        ...current.runs,
      ],
    }));
    return id;
  }, []);

  const retryRun = useCallback<DemoContextValue["retryRun"]>(
    (runId) => {
      const run = state.runs.find((item) => item.id === runId);
      if (!run) return null;
      return startRun({
        source: run.source,
        query: run.query,
        limit: run.limit,
        params: run.params,
      });
    },
    [startRun, state.runs],
  );

  const cancelRun = useCallback<DemoContextValue["cancelRun"]>((runId) => {
    setState((current) => ({
      ...current,
      runs: current.runs.map((run) =>
        run.id === runId && run.status === "running"
          ? {
              ...run,
              status: "cancelled",
              finishedAt: nowIso(),
              logs: [
                ...run.logs,
                { at: nowIso(), stage: run.stage, message: "Execução cancelada pelo usuário" },
              ],
            }
          : run,
      ),
    }));
  }, []);

  const importCsvRows = useCallback<DemoContextValue["importCsvRows"]>((rows) => {
    let imported = 0;
    let duplicates = 0;
    let invalid = 0;
    const createdAt = nowIso();

    setState((current) => {
      const existingKeys = new Set(current.records.flatMap((record) => dedupeKeys(record)));
      const newRecords: CaptureRecordDemo[] = [];

      for (const row of rows) {
        if (!row.companyName.trim()) {
          invalid += 1;
          continue;
        }
        const keys = dedupeKeys(row);
        const isDuplicate = keys.some((key) => existingKeys.has(key));
        if (isDuplicate) duplicates += 1;
        keys.forEach((key) => existingKeys.add(key));

        const duplicateOf = isDuplicate
          ? current.records.find((record) =>
              dedupeKeys(record).some((key) => keys.includes(key)),
            )?.id ?? null
          : null;

        newRecords.push(
          buildRecord(
            {
              companyName: row.companyName.trim(),
              niche: row.niche || "Não informado",
              city: row.city,
              state: row.state,
              neighborhood: "",
              phone: row.phone,
              email: row.email,
              website: row.website,
              instagram: row.instagram,
              contactName: row.contactName,
              rating: null,
              reviewCount: null,
            },
            {
              id: demoId("rec"),
              runId: null,
              source: "csv",
              status: "pending_review",
              capturedAt: createdAt,
              duplicateOfId: duplicateOf,
              history: [{ at: createdAt, label: "Importado via CSV" }],
            },
          ),
        );
        imported += 1;
      }

      return { ...current, records: [...newRecords, ...current.records] };
    });

    return { imported, duplicates, invalid };
  }, []);

  const updateRecord = useCallback<DemoContextValue["updateRecord"]>((id, patch) => {
    setState((current) => ({
      ...current,
      records: current.records.map((record) => {
        if (record.id !== id) return record;
        const merged = { ...record, ...patch };
        const rescore = computeScore(merged);
        return {
          ...merged,
          score: rescore.score,
          scoreFactors: rescore.factors,
          history: [...record.history, { at: nowIso(), label: "Registro editado na revisão" }],
        };
      }),
    }));
  }, []);

  const bulkRecordStatus = useCallback(
    (ids: string[], status: CaptureRecordDemo["status"], label: string) => {
      setState((current) => ({
        ...current,
        records: current.records.map((record) =>
          ids.includes(record.id)
            ? { ...record, status, history: [...record.history, { at: nowIso(), label }] }
            : record,
        ),
      }));
    },
    [],
  );

  const approveRecords = useCallback<DemoContextValue["approveRecords"]>(
    (ids) => bulkRecordStatus(ids, "approved", "Aprovado para prospecção"),
    [bulkRecordStatus],
  );

  const discardRecords = useCallback<DemoContextValue["discardRecords"]>(
    (ids) => bulkRecordStatus(ids, "discarded", "Descartado na revisão"),
    [bulkRecordStatus],
  );

  const promoteRecords = useCallback<DemoContextValue["promoteRecords"]>((ids) => {
    let created = 0;
    setState((current) => {
      const at = nowIso();
      const existingKeys = new Set(current.prospects.flatMap((prospect) => dedupeKeys(prospect)));
      const newProspects: ProspectDemo[] = [];
      let timeline = current.timeline;

      for (const id of ids) {
        const record = current.records.find((item) => item.id === id);
        if (!record || record.status === "promoted" || record.status === "discarded") continue;
        const keys = dedupeKeys(record);
        if (keys.some((key) => existingKeys.has(key))) continue;
        keys.forEach((key) => existingKeys.add(key));

        const prospect: ProspectDemo = {
          id: demoId("pros"),
          recordId: record.id,
          companyName: record.companyName,
          niche: record.niche,
          city: record.city,
          state: record.state,
          phone: record.phone,
          whatsapp: record.whatsapp,
          email: record.email,
          website: record.website,
          instagram: record.instagram,
          contactName: record.contactName,
          source: record.source,
          score: record.score,
          scoreFactors: record.scoreFactors,
          temperature: record.score >= 75 ? "hot" : record.score >= 55 ? "warm" : "cold",
          status: "new",
          ownerId: record.ownerId,
          serviceInterest: record.serviceInterest,
          nextFollowUpAt: null,
          tags: [],
          notes: record.notes,
          archived: false,
          respondedAt: null,
          createdAt: at,
          updatedAt: at,
        };
        newProspects.push(prospect);
        created += 1;
        timeline = [
          {
            id: demoId("tl"),
            refType: "prospect",
            refId: prospect.id,
            at,
            kind: "promotion",
            title: "Prospect criado a partir da captação",
            detail: `${record.companyName} · ${record.city}/${record.state}`,
            done: true,
          },
          ...timeline,
        ];
      }

      return {
        ...current,
        prospects: [...newProspects, ...current.prospects],
        timeline,
        records: current.records.map((record) =>
          ids.includes(record.id) && record.status !== "discarded"
            ? {
                ...record,
                status: "promoted",
                history: [...record.history, { at, label: "Promovido para prospect" }],
              }
            : record,
        ),
      };
    });
    return created;
  }, []);

  const assignRecords = useCallback<DemoContextValue["assignRecords"]>((ids, ownerId) => {
    setState((current) => ({
      ...current,
      records: current.records.map((record) =>
        ids.includes(record.id)
          ? {
              ...record,
              ownerId,
              history: [...record.history, { at: nowIso(), label: "Responsável atualizado" }],
            }
          : record,
      ),
    }));
  }, []);

  const setRecordsService = useCallback<DemoContextValue["setRecordsService"]>((ids, service) => {
    setState((current) => ({
      ...current,
      records: current.records.map((record) =>
        ids.includes(record.id)
          ? {
              ...record,
              serviceInterest: service,
              history: [...record.history, { at: nowIso(), label: `Serviço de interesse: ${service}` }],
            }
          : record,
      ),
    }));
  }, []);

  const mergeDuplicate = useCallback<DemoContextValue["mergeDuplicate"]>((keepId, duplicateId) => {
    setState((current) => {
      const keep = current.records.find((record) => record.id === keepId);
      const dup = current.records.find((record) => record.id === duplicateId);
      if (!keep || !dup) return current;
      const at = nowIso();
      const merged: CaptureRecordDemo = {
        ...keep,
        phone: keep.phone || dup.phone,
        email: keep.email || dup.email,
        website: keep.website || dup.website,
        instagram: keep.instagram || dup.instagram,
        contactName: keep.contactName || dup.contactName,
        reviewCount: keep.reviewCount ?? dup.reviewCount,
        rating: keep.rating ?? dup.rating,
        history: [...keep.history, { at, label: `Mesclado com ${dup.companyName}` }],
      };
      const rescore = computeScore(merged);
      return {
        ...current,
        records: current.records
          .filter((record) => record.id !== duplicateId)
          .map((record) =>
            record.id === keepId
              ? { ...merged, score: rescore.score, scoreFactors: rescore.factors }
              : record,
          ),
      };
    });
  }, []);

  const keepSeparate = useCallback<DemoContextValue["keepSeparate"]>((recordId) => {
    setState((current) => ({
      ...current,
      records: current.records.map((record) =>
        record.id === recordId
          ? {
              ...record,
              duplicateOfId: null,
              history: [...record.history, { at: nowIso(), label: "Mantido como registro separado" }],
            }
          : record,
      ),
    }));
  }, []);

  const createProspectManually = useCallback<DemoContextValue["createProspectManually"]>((input) => {
    setState((current) => {
      const keys = dedupeKeys(input);
      const existing = current.prospects.find((prospect) =>
        dedupeKeys(prospect).some((key) => keys.includes(key)),
      );
      if (existing) return current;
      const at = nowIso();
      const { score, factors } = computeScore({ ...input, rating: null, reviewCount: null });
      const prospect: ProspectDemo = {
        id: demoId("pros"),
        recordId: null,
        companyName: input.companyName,
        niche: input.niche || "Não informado",
        city: input.city,
        state: input.state,
        phone: input.phone,
        whatsapp: Boolean(input.phone),
        email: input.email,
        website: input.website,
        instagram: input.instagram,
        contactName: input.contactName,
        source: "manual",
        score,
        scoreFactors: factors,
        temperature: score >= 75 ? "hot" : score >= 55 ? "warm" : "cold",
        status: "new",
        ownerId: input.ownerId,
        serviceInterest: input.serviceInterest,
        nextFollowUpAt: null,
        tags: [],
        notes: "",
        archived: false,
        respondedAt: null,
        createdAt: at,
        updatedAt: at,
      };
      return {
        ...current,
        prospects: [prospect, ...current.prospects],
        timeline: pushTimeline(current, {
          refType: "prospect",
          refId: prospect.id,
          at,
          kind: "promotion",
          title: "Prospect cadastrado manualmente",
          detail: prospect.companyName,
          done: true,
        }),
      };
    });
  }, []);

  const bulkUpdateProspects = useCallback<DemoContextValue["bulkUpdateProspects"]>((ids, patch) => {
    setState((current) => ({
      ...current,
      prospects: current.prospects.map((prospect) =>
        ids.includes(prospect.id) ? { ...prospect, ...patch, updatedAt: nowIso() } : prospect,
      ),
    }));
  }, []);

  const updateProspect = useCallback<DemoContextValue["updateProspect"]>(
    (id, patch) => bulkUpdateProspects([id], patch),
    [bulkUpdateProspects],
  );

  const scheduleFollowUp = useCallback<DemoContextValue["scheduleFollowUp"]>((ids, dueAtIso) => {
    setState((current) => {
      const at = nowIso();
      const events: TimelineEvent[] = ids.map((id) => ({
        id: demoId("tl"),
        refType: "prospect",
        refId: id,
        at: dueAtIso,
        kind: "followup",
        title: "Follow-up agendado",
        detail: "Ação manual registrada pela equipe",
        done: false,
      }));
      return {
        ...current,
        prospects: current.prospects.map((prospect) =>
          ids.includes(prospect.id)
            ? { ...prospect, nextFollowUpAt: dueAtIso, updatedAt: at }
            : prospect,
        ),
        timeline: [...events, ...current.timeline],
      };
    });
  }, []);

  const completeFollowUp = useCallback<DemoContextValue["completeFollowUp"]>((prospectId) => {
    setState((current) => {
      const at = nowIso();
      let markedOne = false;
      const timeline = current.timeline.map((event) => {
        if (markedOne || event.refId !== prospectId || event.kind !== "followup" || event.done) {
          return event;
        }
        markedOne = true;
        return { ...event, done: true, detail: "Follow-up concluído" };
      });
      return {
        ...current,
        prospects: current.prospects.map((prospect) =>
          prospect.id === prospectId
            ? { ...prospect, nextFollowUpAt: null, updatedAt: at }
            : prospect,
        ),
        timeline,
      };
    });
  }, []);

  const addProspectNote = useCallback<DemoContextValue["addProspectNote"]>((prospectId, note) => {
    setState((current) => {
      const at = nowIso();
      return {
        ...current,
        prospects: current.prospects.map((prospect) =>
          prospect.id === prospectId
            ? {
                ...prospect,
                notes: prospect.notes ? `${prospect.notes}\n${note}` : note,
                updatedAt: at,
              }
            : prospect,
        ),
        timeline: pushTimeline(current, {
          refType: "prospect",
          refId: prospectId,
          at,
          kind: "note",
          title: "Nota adicionada",
          detail: note,
          done: true,
        }),
      };
    });
  }, []);

  const addProspectTag = useCallback<DemoContextValue["addProspectTag"]>((ids, tag) => {
    const clean = tag.trim();
    if (!clean) return;
    setState((current) => ({
      ...current,
      prospects: current.prospects.map((prospect) =>
        ids.includes(prospect.id) && !prospect.tags.includes(clean)
          ? { ...prospect, tags: [...prospect.tags, clean], updatedAt: nowIso() }
          : prospect,
      ),
    }));
  }, []);

  const archiveProspects = useCallback<DemoContextValue["archiveProspects"]>((ids) => {
    setState((current) => ({
      ...current,
      prospects: current.prospects.map((prospect) =>
        ids.includes(prospect.id) ? { ...prospect, archived: true, updatedAt: nowIso() } : prospect,
      ),
    }));
  }, []);

  const resetDemoData = useCallback(() => {
    const fresh = createSeedState();
    setState(fresh);
    try {
      window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(fresh));
    } catch {
      // ignorado
    }
  }, []);

  const value = useMemo<DemoContextValue>(
    () => ({
      ...state,
      hydrated,
      startRun,
      retryRun,
      cancelRun,
      importCsvRows,
      updateRecord,
      approveRecords,
      discardRecords,
      promoteRecords,
      assignRecords,
      setRecordsService,
      mergeDuplicate,
      keepSeparate,
      createProspectManually,
      updateProspect,
      bulkUpdateProspects,
      scheduleFollowUp,
      completeFollowUp,
      addProspectNote,
      addProspectTag,
      archiveProspects,
      resetDemoData,
    }),
    [
      state,
      hydrated,
      startRun,
      retryRun,
      cancelRun,
      importCsvRows,
      updateRecord,
      approveRecords,
      discardRecords,
      promoteRecords,
      assignRecords,
      setRecordsService,
      mergeDuplicate,
      keepSeparate,
      createProspectManually,
      updateProspect,
      bulkUpdateProspects,
      scheduleFollowUp,
      completeFollowUp,
      addProspectNote,
      addProspectTag,
      archiveProspects,
      resetDemoData,
    ],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

/** Avança um estágio de cada execução em andamento e materializa os registros no final. */
function advanceRunningRuns(current: DemoState): DemoState {
  let records = current.records;
  const at = nowIso();

  const runs = current.runs.map((run) => {
    if (run.status !== "running") return run;
    const index = RUN_STAGES.indexOf(run.stage);
    const nextStage: RunStage = RUN_STAGES[Math.min(index + 1, RUN_STAGES.length - 1)]!;
    const duplicates = Math.max(0, Math.round(run.limit * 0.15));
    const found = run.limit;

    if (run.stage === "review") return run;

    const partial: CaptureRunDemo = {
      ...run,
      stage: nextStage,
      durationMs: run.durationMs + TICK_MS,
      found: nextStage === "collecting" ? 0 : found,
      duplicates: index + 1 >= RUN_STAGES.indexOf("deduplicating") ? duplicates : 0,
      accepted: nextStage === "review" ? found - duplicates : run.accepted,
      logs: [...run.logs, { at, stage: nextStage, message: stageMessage(nextStage, found, duplicates) }],
    };

    if (nextStage === "review") {
      const created = generateRecordsForRun(
        run.id,
        run.source,
        Math.max(1, found - duplicates),
        records.length,
      );
      records = [...created, ...records];
      return { ...partial, status: "completed" as const, finishedAt: at };
    }

    return partial;
  });

  return { ...current, runs, records };
}

function stageMessage(stage: RunStage, found: number, duplicates: number): string {
  switch (stage) {
    case "normalizing":
      return `${found} registros normalizados (telefone, domínio e endereço)`;
    case "deduplicating":
      return `${duplicates} possíveis duplicidades sinalizadas`;
    case "enriching":
      return "Dados públicos consolidados por registro";
    case "scoring":
      return "Score de qualidade calculado com fatores explicáveis";
    case "review":
      return "Registros liberados para revisão";
    default:
      return STAGE_LABEL[stage];
  }
}
