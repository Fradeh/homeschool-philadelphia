const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL is required");

export function buildApiUrl(path: string) {
  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<TResponse>(path: string, init?: RequestInit): Promise<TResponse> {
  const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData;
  const response = await fetch(buildApiUrl(path), {
    ...init,
    credentials: "include",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...init?.headers
    }
  });

  if (!response.ok) {
    let message = `La solicitud falló con estado ${response.status}.`;
    let payload: Record<string, unknown> = {};
    try {
      payload = (await response.json()) as Record<string, unknown>;
      if (Array.isArray(payload.message)) message = payload.message.join(" ");
      else if (typeof payload.message === "string") message = payload.message;
    } catch {
      // Some API errors have no JSON body; keep the status-based fallback.
    }
    throw new ApiError(message, response.status, payload);
  }

  if (response.status === 204) return undefined as TResponse;
  return response.json() as Promise<TResponse>;
}
