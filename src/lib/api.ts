/**
 * Thin fetch wrapper for the Express API.
 *
 * In dev the Vite proxy forwards `/api` (and `/uploads`) to localhost:4000, so
 * the browser only ever talks to one origin. `VITE_API_URL` lets a deployed
 * build point somewhere else (e.g. an absolute API host).
 */
const BASE = (import.meta.env["VITE_API_URL"] as string | undefined)?.replace(/\/$/, "") ?? "";

export const TOKEN_KEY = "fn-admin-token";

export const getToken = () => window.localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string) => window.localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => window.localStorage.removeItem(TOKEN_KEY);

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type Options = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
  auth?: boolean;
};

async function request<T>(path: string, options: Options = {}): Promise<T> {
  const { method = "GET", body, signal, auth = false } = options;
  const headers: Record<string, string> = {};

  if (body !== undefined && !(body instanceof FormData))
    headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const init: RequestInit = { method, headers };
  if (signal) init.signal = signal;
  if (body !== undefined) init.body = body instanceof FormData ? body : JSON.stringify(body);

  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, init);
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError") throw cause;
    // Network-level failure: server not running / host unreachable.
    throw new ApiError("Cannot reach the API server", 0);
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const data = text ? (JSON.parse(text) as T) : (undefined as T);

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "error" in data && typeof data.error === "string"
        ? data.error
        : `Request failed (${response.status})`;
    throw new ApiError(message, response.status);
  }

  return data;
}

export const api = {
  get: <T>(path: string, options?: Options) => request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: Options) =>
    request<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: unknown, options?: Options) =>
    request<T>(path, { ...options, method: "PUT", body }),
  del: <T>(path: string, options?: Options) => request<T>(path, { ...options, method: "DELETE" }),
  upload: <T>(path: string, file: File, fields: Record<string, string> = {}) => {
    const form = new FormData();
    form.append("file", file);
    for (const [key, value] of Object.entries(fields)) form.append(key, value);
    return request<T>(path, { method: "POST", body: form, auth: true });
  },
};
