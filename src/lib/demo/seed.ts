// Dados de demonstração determinísticos e geradores da Fase 1.
// Nada aqui é aleatório por render: tudo derivado de índices estáveis.
import { OWNERS, SERVICES } from "./catalog";
import type {
  CaptureRecordDemo,
  CaptureRunDemo,
  CaptureSourceKey,
  DemoState,
  ProspectDemo,
  ScoreFactor,
  TimelineEvent,
} from "./types";

export const DEMO_VERSION = 1;
export const DEMO_STORAGE_KEY = "ctrl-ltv:demo:v1";

type CompanySeed = {
  companyName: string;
  niche: string;
  city: string;
  state: string;
  neighborhood: string;
  phone: string;
  email: string;
  website: string;
  instagram: string;
  contactName: string;
  rating: number | null;
  reviewCount: number | null;
};

const COMPANY_POOL: CompanySeed[] = [
  { companyName: "Padaria Aurora", niche: "Alimentação", city: "Campinas", state: "SP", neighborhood: "Cambuí", phone: "+55 19 3234-1180", email: "contato@padariaaurora.com.br", website: "padariaaurora.com.br", instagram: "@padariaaurora", contactName: "Helena Braga", rating: 4.7, reviewCount: 412 },
  { companyName: "Studio Norte Odontologia", niche: "Saúde", city: "Ribeirão Preto", state: "SP", neighborhood: "Jardim Irajá", phone: "+55 16 3610-7742", email: "agenda@studionorte.com.br", website: "studionorte.com.br", instagram: "@studionorteodonto", contactName: "Rodrigo Sena", rating: 4.9, reviewCount: 268 },
  { companyName: "Ótica Vitrine", niche: "Varejo", city: "Sorocaba", state: "SP", neighborhood: "Centro", phone: "+55 15 3221-9084", email: "", website: "", instagram: "@oticavitrine", contactName: "Cláudia Reis", rating: 4.2, reviewCount: 87 },
  { companyName: "Marmoraria Vega", niche: "Construção", city: "Jundiaí", state: "SP", neighborhood: "Vila Rami", phone: "+55 11 4587-3311", email: "orcamento@marmorariavega.com.br", website: "marmorariavega.com.br", instagram: "", contactName: "Everton Lima", rating: 4.4, reviewCount: 63 },
  { companyName: "Clínica Origem", niche: "Saúde", city: "Belo Horizonte", state: "MG", neighborhood: "Savassi", phone: "+55 31 3273-5590", email: "contato@clinicaorigem.com.br", website: "clinicaorigem.com.br", instagram: "@clinicaorigem", contactName: "Patrícia Mota", rating: 4.8, reviewCount: 331 },
  { companyName: "Autoescola Rota", niche: "Serviços", city: "Curitiba", state: "PR", neighborhood: "Portão", phone: "+55 41 3332-4471", email: "", website: "autoescolarota.com.br", instagram: "@autoescolarota", contactName: "Sérgio Kühn", rating: 3.9, reviewCount: 154 },
  { companyName: "Panificadora Sol", niche: "Alimentação", city: "Londrina", state: "PR", neighborhood: "Gleba Palhano", phone: "+55 43 3324-1122", email: "sol@panificadorasol.com.br", website: "", instagram: "@panificadorasol", contactName: "Amanda Kato", rating: 4.6, reviewCount: 208 },
  { companyName: "Pet Care Mais", niche: "Pet", city: "Florianópolis", state: "SC", neighborhood: "Trindade", phone: "+55 48 3025-7788", email: "atendimento@petcaremais.com.br", website: "petcaremais.com.br", instagram: "@petcaremais", contactName: "Bruno Ferraz", rating: 4.9, reviewCount: 512 },
  { companyName: "Academia Pulso", niche: "Fitness", city: "Goiânia", state: "GO", neighborhood: "Setor Bueno", phone: "+55 62 3251-4409", email: "", website: "", instagram: "@academiapulso", contactName: "Renata Dias", rating: 4.1, reviewCount: 44 },
  { companyName: "Escritório Contábil Módulo", niche: "Contabilidade", city: "Porto Alegre", state: "RS", neighborhood: "Moinhos de Vento", phone: "+55 51 3019-6620", email: "contato@modulocontabil.com.br", website: "modulocontabil.com.br", instagram: "", contactName: "Jonas Vieira", rating: 4.5, reviewCount: 96 },
  { companyName: "Móveis Linha Clara", niche: "Varejo", city: "Bento Gonçalves", state: "RS", neighborhood: "Centro", phone: "+55 54 3452-8890", email: "vendas@linhaclara.com.br", website: "linhaclara.com.br", instagram: "@moveislinhaclara", contactName: "Tatiane Bortolin", rating: 4.6, reviewCount: 121 },
  { companyName: "Escola Semear", niche: "Educação", city: "Recife", state: "PE", neighborhood: "Boa Viagem", phone: "+55 81 3466-2210", email: "secretaria@escolasemear.com.br", website: "escolasemear.com.br", instagram: "@escolasemear", contactName: "Luciano Amaral", rating: 4.7, reviewCount: 187 },
  { companyName: "Barbearia Nove", niche: "Beleza", city: "Fortaleza", state: "CE", neighborhood: "Meireles", phone: "+55 85 3242-1177", email: "", website: "", instagram: "@barbearianove", contactName: "Igor Tavares", rating: 4.8, reviewCount: 342 },
  { companyName: "Transportes Vale Norte", niche: "Logística", city: "Manaus", state: "AM", neighborhood: "Distrito Industrial", phone: "+55 92 3236-9911", email: "comercial@valenorte.com.br", website: "valenorte.com.br", instagram: "", contactName: "Cristiane Lopes", rating: 4.0, reviewCount: 38 },
  { companyName: "Buffet Encanto", niche: "Eventos", city: "Salvador", state: "BA", neighborhood: "Pituba", phone: "+55 71 3345-6602", email: "eventos@buffetencanto.com.br", website: "buffetencanto.com.br", instagram: "@buffetencanto", contactName: "Marcos Serra", rating: 4.4, reviewCount: 74 },
  { companyName: "Imobiliária Cais", niche: "Imobiliário", city: "Santos", state: "SP", neighborhood: "Gonzaga", phone: "+55 13 3289-4410", email: "contato@imobiliariacais.com.br", website: "imobiliariacais.com.br", instagram: "@imobiliariacais", contactName: "Fernanda Duarte", rating: 4.3, reviewCount: 129 },
  { companyName: "Serralheria Ponto Fixo", niche: "Construção", city: "Uberlândia", state: "MG", neighborhood: "Tibery", phone: "+55 34 3214-7730", email: "", website: "", instagram: "", contactName: "Wagner Costa", rating: 3.8, reviewCount: 21 },
  { companyName: "Farmácia Vida Plena", niche: "Saúde", city: "Vitória", state: "ES", neighborhood: "Praia do Canto", phone: "+55 27 3325-8811", email: "contato@vidaplena.com.br", website: "vidaplena.com.br", instagram: "@farmaciavidaplena", contactName: "Aline Peixoto", rating: 4.6, reviewCount: 256 },
  { companyName: "Consultório Sorriso Real", niche: "Saúde", city: "Campo Grande", state: "MS", neighborhood: "Jardim dos Estados", phone: "+55 67 3324-5510", email: "agenda@sorrisoreal.com.br", website: "", instagram: "@sorrisorealcg", contactName: "Débora Nunes", rating: 4.9, reviewCount: 143 },
  { companyName: "Lava Rápido Cristal", niche: "Automotivo", city: "Maringá", state: "PR", neighborhood: "Zona 7", phone: "+55 44 3026-3390", email: "", website: "", instagram: "@lavarapidocristal", contactName: "Paulo Menezes", rating: 4.2, reviewCount: 58 },
];

function iso(daysAgo: number, hour = 9, minute = 0): string {
  const base = new Date();
  base.setUTCHours(hour, minute, 0, 0);
  base.setUTCDate(base.getUTCDate() - daysAgo);
  return base.toISOString();
}

export function computeScore(input: {
  phone: string;
  email: string;
  website: string;
  instagram: string;
  rating: number | null;
  reviewCount: number | null;
}): { score: number; factors: ScoreFactor[] } {
  const factors: ScoreFactor[] = [];
  let score = 45;

  if (input.phone) {
    score += 14;
    factors.push({ label: "Telefone disponível para contato", impact: "positive", weight: 14 });
  } else {
    score -= 12;
    factors.push({ label: "Sem telefone cadastrado", impact: "negative", weight: 12 });
  }

  if (input.website) {
    score += 10;
    factors.push({ label: "Possui site próprio", impact: "positive", weight: 10 });
  } else {
    score -= 6;
    factors.push({ label: "Sem site identificado", impact: "negative", weight: 6 });
  }

  if (input.instagram) {
    score += 7;
    factors.push({ label: "Presença ativa no Instagram", impact: "positive", weight: 7 });
  }

  if (input.email) {
    score += 6;
    factors.push({ label: "E-mail comercial disponível", impact: "positive", weight: 6 });
  }

  if (input.rating !== null) {
    if (input.rating >= 4.5) {
      score += 12;
      factors.push({ label: `Reputação alta (${input.rating.toFixed(1)})`, impact: "positive", weight: 12 });
    } else if (input.rating < 4) {
      score -= 8;
      factors.push({ label: `Reputação abaixo do ideal (${input.rating.toFixed(1)})`, impact: "negative", weight: 8 });
    }
  }

  if (input.reviewCount !== null) {
    if (input.reviewCount >= 100) {
      score += 10;
      factors.push({ label: `${input.reviewCount} avaliações indicam volume de clientes`, impact: "positive", weight: 10 });
    } else if (input.reviewCount < 30) {
      score -= 7;
      factors.push({ label: "Poucas avaliações públicas", impact: "negative", weight: 7 });
    }
  }

  return { score: Math.max(5, Math.min(99, Math.round(score))), factors };
}

export function normalizePhone(value: string): string {
  return value.replace(/\D/g, "");
}

export function normalizeDomain(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
}

/** Chaves de deduplicação: telefone, domínio, e-mail, instagram e nome+cidade. */
export function dedupeKeys(record: {
  companyName: string;
  city: string;
  phone: string;
  email: string;
  website: string;
  instagram: string;
}): string[] {
  const keys: string[] = [];
  const phone = normalizePhone(record.phone);
  if (phone.length >= 8) keys.push(`tel:${phone.slice(-10)}`);
  const domain = normalizeDomain(record.website);
  if (domain) keys.push(`dom:${domain}`);
  if (record.email) keys.push(`mail:${record.email.trim().toLowerCase()}`);
  if (record.instagram) keys.push(`ig:${record.instagram.trim().toLowerCase().replace(/^@/, "")}`);
  keys.push(`name:${record.companyName.trim().toLowerCase()}|${record.city.trim().toLowerCase()}`);
  return keys;
}

let idCounter = 0;
export function demoId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter.toString(36)}`;
}

export function buildRecord(
  seed: CompanySeed,
  options: {
    id: string;
    runId: string | null;
    source: CaptureSourceKey;
    status: CaptureRecordDemo["status"];
    capturedAt: string;
    ownerId?: string | null;
    serviceInterest?: string | null;
    notes?: string;
    duplicateOfId?: string | null;
    history?: Array<{ at: string; label: string }>;
  },
): CaptureRecordDemo {
  const { score, factors } = computeScore(seed);
  return {
    id: options.id,
    runId: options.runId,
    source: options.source,
    companyName: seed.companyName,
    niche: seed.niche,
    city: seed.city,
    state: seed.state,
    neighborhood: seed.neighborhood,
    address: `${seed.neighborhood}, ${seed.city} - ${seed.state}`,
    phone: seed.phone,
    whatsapp: Boolean(seed.phone),
    email: seed.email,
    website: seed.website,
    instagram: seed.instagram,
    rating: seed.rating,
    reviewCount: seed.reviewCount,
    contactName: seed.contactName,
    score,
    scoreFactors: factors,
    status: options.status,
    ownerId: options.ownerId ?? null,
    serviceInterest: options.serviceInterest ?? null,
    notes: options.notes ?? "",
    duplicateOfId: options.duplicateOfId ?? null,
    capturedAt: options.capturedAt,
    history: options.history ?? [{ at: options.capturedAt, label: "Registro capturado" }],
  };
}

/** Gera registros determinísticos para uma execução simulada. */
export function generateRecordsForRun(
  runId: string,
  source: CaptureSourceKey,
  count: number,
  offset: number,
): CaptureRecordDemo[] {
  const now = new Date().toISOString();
  return Array.from({ length: count }, (_, index) => {
    const pool = COMPANY_POOL[(offset + index) % COMPANY_POOL.length]!;
    const cycle = Math.floor((offset + index) / COMPANY_POOL.length);
    const seed: CompanySeed =
      cycle === 0 ? pool : { ...pool, companyName: `${pool.companyName} — Unidade ${cycle + 1}` };
    return buildRecord(seed, {
      id: demoId("rec"),
      runId,
      source,
      status: "pending_review",
      capturedAt: now,
      history: [{ at: now, label: "Registro capturado pela execução" }],
    });
  });
}

function seedRun(
  index: number,
  source: CaptureSourceKey,
  query: string,
  daysAgo: number,
  counts: { found: number; duplicates: number; errors: number },
): CaptureRunDemo {
  const startedAt = iso(daysAgo, 10, 12);
  const durationMs = 42_000 + index * 7_500;
  return {
    id: `run-seed-${index}`,
    source,
    query,
    params: [
      { label: "Limite", value: String(counts.found) },
      { label: "Exigir telefone", value: "Sim" },
    ],
    startedAt,
    finishedAt: new Date(new Date(startedAt).getTime() + durationMs).toISOString(),
    status: "completed",
    stage: "review",
    limit: counts.found,
    found: counts.found,
    accepted: counts.found - counts.duplicates - counts.errors,
    duplicates: counts.duplicates,
    errors: counts.errors,
    durationMs,
    logs: [
      { at: startedAt, stage: "collecting", message: `Consulta enviada: ${query}` },
      { at: startedAt, stage: "normalizing", message: "Telefones e domínios normalizados" },
      { at: startedAt, stage: "deduplicating", message: `${counts.duplicates} duplicidades sinalizadas` },
      { at: startedAt, stage: "enriching", message: "Dados públicos consolidados" },
      { at: startedAt, stage: "scoring", message: "Score de qualidade calculado" },
      { at: startedAt, stage: "review", message: "Registros liberados para revisão" },
    ],
  };
}

export function createSeedState(): DemoState {
  const runs: CaptureRunDemo[] = [
    seedRun(1, "google_places", "clínicas odontológicas · Ribeirão Preto/SP", 1, { found: 12, duplicates: 2, errors: 0 }),
    seedRun(2, "google_places", "padarias · Campinas/SP", 4, { found: 8, duplicates: 1, errors: 1 }),
    seedRun(3, "referral", "indicações da carteira ativa", 9, { found: 5, duplicates: 0, errors: 0 }),
  ];

  const statuses: CaptureRecordDemo["status"][] = [
    "pending_review",
    "pending_review",
    "approved",
    "promoted",
    "discarded",
    "pending_review",
    "approved",
    "promoted",
    "pending_review",
    "captured",
    "pending_review",
    "approved",
    "discarded",
    "pending_review",
    "captured",
    "pending_review",
    "pending_review",
    "approved",
    "promoted",
    "pending_review",
  ];

  const records: CaptureRecordDemo[] = COMPANY_POOL.map((seed, index) => {
    const run = runs[index % runs.length]!;
    const status = statuses[index]!;
    const capturedAt = iso(1 + (index % 12), 11, index);
    const history: Array<{ at: string; label: string }> = [
      { at: capturedAt, label: "Registro capturado" },
    ];
    if (status === "approved" || status === "promoted") {
      history.push({ at: capturedAt, label: "Aprovado para prospecção" });
    }
    if (status === "promoted") history.push({ at: capturedAt, label: "Promovido para prospect" });
    if (status === "discarded") history.push({ at: capturedAt, label: "Descartado na revisão" });

    return buildRecord(seed, {
      id: `rec-seed-${index + 1}`,
      runId: run.id,
      source: run.source,
      status,
      capturedAt,
      ownerId: status === "captured" ? null : OWNERS[index % OWNERS.length]!.id,
      serviceInterest: status === "captured" ? null : SERVICES[index % SERVICES.length]!,
      notes: "",
      duplicateOfId: null,
      history,
    });
  });

  // Duplicidade proposital para a comparação lado a lado.
  const duplicateSource = COMPANY_POOL[0]!;
  const duplicateRecord = buildRecord(
    { ...duplicateSource, contactName: "Helena B.", email: "", reviewCount: 398 },
    {
      id: "rec-seed-dup",
      runId: runs[1]!.id,
      source: "csv",
      status: "pending_review",
      capturedAt: iso(2, 15, 30),
      duplicateOfId: "rec-seed-1",
      history: [
        { at: iso(2, 15, 30), label: "Registro capturado" },
        { at: iso(2, 15, 31), label: "Possível duplicidade de Padaria Aurora" },
      ],
    },
  );
  records.push(duplicateRecord);

  const promotedRecords = records.filter((record) => record.status === "promoted");
  const prospectStatuses: ProspectDemo["status"][] = ["contact_started", "replied", "negotiation"];
  const temperatures: ProspectDemo["temperature"][] = ["hot", "warm", "cold"];

  const prospects: ProspectDemo[] = promotedRecords.map((record, index) => {
    const createdAt = iso(6 - index, 14, 0);
    return {
      id: `pros-seed-${index + 1}`,
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
      temperature: temperatures[index % temperatures.length]!,
      status: prospectStatuses[index % prospectStatuses.length]!,
      ownerId: record.ownerId,
      serviceInterest: record.serviceInterest,
      nextFollowUpAt: index === 0 ? iso(2, 9, 0) : iso(-2, 9, 0),
      tags: index === 0 ? ["prioridade"] : [],
      notes: "",
      archived: false,
      respondedAt: index === 1 ? iso(3, 16, 0) : null,
      createdAt,
      updatedAt: createdAt,
    };
  });

  const timeline: TimelineEvent[] = prospects.flatMap((prospect, index) => [
    {
      id: `tl-seed-${index}-a`,
      refType: "prospect" as const,
      refId: prospect.id,
      at: prospect.createdAt,
      kind: "promotion" as const,
      title: "Prospect criado a partir da captação",
      detail: `Origem: ${prospect.source}`,
      done: true,
    },
    {
      id: `tl-seed-${index}-b`,
      refType: "prospect" as const,
      refId: prospect.id,
      at: prospect.nextFollowUpAt ?? prospect.createdAt,
      kind: "followup" as const,
      title: "Follow-up comercial agendado",
      detail: "Ação manual registrada pela equipe",
      done: false,
    },
  ]);

  return { version: DEMO_VERSION, runs, records, prospects, timeline };
}
