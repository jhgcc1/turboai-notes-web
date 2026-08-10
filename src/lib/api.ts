/** Thin API client — no business rules. */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type User = { id: number; email: string; date_joined: string };
export type Category = {
  id: number;
  name: string;
  color: string;
  note_count: number;
  created_at: string;
};
export type Note = {
  id: number;
  title: string;
  body: string;
  category: number;
  category_name: string;
  category_color: string;
  created_at: string;
  updated_at: string;
};

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    super(`API error ${status}`);
    this.status = status;
    this.body = body;
  }
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS", "TRACE"]);

/** In-memory CSRF token from /api/auth/csrf/ (readable cross-origin; cookie is not). */
let csrfTokenMemory: string | null = null;

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

async function ensureCsrfToken(): Promise<string | null> {
  const existing = csrfTokenMemory ?? getCookie("csrftoken");
  if (existing) return existing;
  const res = await fetch(`${API_URL}/api/auth/csrf/`, { credentials: "include" });
  const data = (await res.json().catch(() => ({}))) as { csrfToken?: string };
  if (typeof data.csrfToken === "string" && data.csrfToken) {
    csrfTokenMemory = data.csrfToken;
    return data.csrfToken;
  }
  return getCookie("csrftoken");
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const method = (init.method ?? "GET").toUpperCase();
  if (!SAFE_METHODS.has(method)) {
    const csrfToken = await ensureCsrfToken();
    if (csrfToken) headers.set("X-CSRFToken", csrfToken);
  }
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers,
      credentials: "include",
    });
  } catch (err) {
    // Network / CORS failures — rethrow as Error with stack for catch sites
    // that call reportUnexpected (no LLM calls from the browser).
    const message = err instanceof Error ? err.message : "Network request failed";
    throw new Error(message, { cause: err });
  }
  if (res.status === 204) {
    return undefined as T;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, data);
  }
  return data as T;
}

export const api = {
  csrf: async () => {
    const data = await request<{ detail: string; csrfToken?: string }>("/api/auth/csrf/");
    if (typeof data.csrfToken === "string" && data.csrfToken) {
      csrfTokenMemory = data.csrfToken;
    }
    return data;
  },
  register: (email: string, password: string) =>
    request<User>("/api/auth/register/", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  login: (email: string, password: string) =>
    request<User>("/api/auth/login/", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request<{ detail: string }>("/api/auth/logout/", { method: "POST" }),
  me: () => request<User>("/api/auth/me/"),
  categories: () => request<Category[]>("/api/categories/"),
  notes: (categoryId?: number) =>
    request<Note[]>(categoryId ? `/api/notes/?category=${categoryId}` : "/api/notes/"),
  getNote: (id: number) => request<Note>(`/api/notes/${id}/`),
  createNote: (payload: { title: string; body: string; category: number }) =>
    request<Note>("/api/notes/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateNote: (id: number, payload: Partial<{ title: string; body: string; category: number }>) =>
    request<Note>(`/api/notes/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteNote: (id: number) => request<void>(`/api/notes/${id}/`, { method: "DELETE" }),
  reportClientError: (payload: {
    message: string;
    stack?: string;
    url?: string;
    user_agent?: string;
    request_id?: string;
    source?: string;
  }) =>
    request<{ detail: string; fingerprint: string }>("/api/observability/client-error/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

/** Test helper — clears the in-memory CSRF token between cases. */
export function _resetCsrfTokenForTests(): void {
  csrfTokenMemory = null;
}

export function formatNoteDate(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startYesterday = new Date(startToday);
  startYesterday.setDate(startYesterday.getDate() - 1);
  if (d >= startToday) return "today";
  if (d >= startYesterday) return "yesterday";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

/** Editor "Last Edited" — Figma/video: `July 21, 2024 at 8:35pm`. */
export function formatLastEdited(iso: string): string {
  const d = new Date(iso);
  const datePart = d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const meridiem = hours >= 12 ? "pm" : "am";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${datePart} at ${hours}:${minutes}${meridiem}`;
}
