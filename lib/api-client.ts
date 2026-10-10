const REQUEST_TIMEOUT_MS = 25_000;

export async function fetchJson<T>(
  input: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    cache: init?.cache ?? "no-store",
    signal: init?.signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message =
      typeof body === "object" && body !== null && "error" in body &&
      typeof body.error === "string"
        ? body.error
        : `Не удалось загрузить данные (${response.status})`;
    throw new Error(message);
  }
  return (await response.json()) as T;
}
