/** Report unexpected failures to observability — never expected 4xx auth/validation. */

import { ApiError } from "./api";
import { reportClientError } from "./clientError";

/** Statuses that are normal product behavior, not programmer/infra failures. */
const EXPECTED_API_STATUSES = new Set([400, 401, 403, 404, 409, 422, 429]);

/**
 * Fire-and-forget report for catch blocks that also set UI error state.
 * Skips expected ApiError statuses so login failures do not open Jira tickets.
 */
export function reportUnexpected(err: unknown, source: string): void {
  if (err instanceof ApiError) {
    if (EXPECTED_API_STATUSES.has(err.status)) return;
    void reportClientError({
      message: `ApiError ${err.status}: ${err.message}`,
      stack: err.stack,
      source,
    });
    return;
  }
  if (err instanceof Error) {
    void reportClientError({
      message: err.message || "unexpected error",
      stack: err.stack,
      source,
    });
    return;
  }
  void reportClientError({
    message: typeof err === "string" ? err : "unexpected non-Error throw",
    source,
  });
}
