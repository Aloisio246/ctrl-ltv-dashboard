/**
 * Central HTTP client stub.
 *
 * Fase 0: apenas simulação. Nenhuma chamada real é feita.
 * Quando `VITE_API_URL` for definido, este cliente será substituído pela
 * implementação real usando fetch tipado + contratos compartilhados.
 */

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? "";

export class ApiUnavailableError extends Error {
  constructor(message = "API indisponível") {
    super(message);
    this.name = "ApiUnavailableError";
  }
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiUnavailableError };

// Placeholder: nunca chamado nesta fase.
export async function apiFetch<T>(_path: string): Promise<ApiResult<T>> {
  return { ok: false, error: new ApiUnavailableError("Backend não conectado") };
}
