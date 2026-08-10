/** Fire-and-forget browser error reporter — no business rules. */

import { api } from "./api";

export type ClientErrorPayload = {
  message: string;
  stack?: string;
  url?: string;
  userAgent?: string;
  requestId?: string;
  source?: "window.onerror" | "unhandledrejection" | "boundary" | string;
};

const MAX_MESSAGE = 2000;
const MAX_STACK = 8000;

let lastSentAt = 0;
const MIN_INTERVAL_MS = 2_000;

/**
 * POST a client error to the API so it becomes a structured backend ERROR log
 * (CloudWatch → triage Lambda → MiniMax → Jira). The browser never calls an
 * LLM — only the triage Lambda does. Never throws.
 */
export async function reportClientError(payload: ClientErrorPayload): Promise<void> {
  if (typeof window === "undefined") return;
  const now = Date.now();
  if (now - lastSentAt < MIN_INTERVAL_MS) return;
  lastSentAt = now;

  const message = (payload.message || "unknown client error").slice(0, MAX_MESSAGE);
  const stack = (payload.stack || "").slice(0, MAX_STACK);
  try {
    await api.reportClientError({
      message,
      stack,
      url: payload.url ?? window.location.href,
      user_agent: payload.userAgent ?? navigator.userAgent,
      request_id: payload.requestId ?? "",
      source: payload.source ?? "window.onerror",
    });
  } catch {
    // Swallow — reporting must not break the app or recurse.
  }
}

/** Test helper — resets the client-side rate gate. */
export function _resetClientErrorGateForTests(): void {
  lastSentAt = 0;
}
