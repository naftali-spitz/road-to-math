const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "/api";
export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...init, headers: { "Content-Type": "application/json", ...init?.headers }
    });
  } catch { throw new Error("Unable to reach the Road to Math API. Your saved progress is safe; try again."); }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(body?.error ?? `Request failed with ${response.status}`, response.status);
  }
  return response.json() as Promise<T>;
}
