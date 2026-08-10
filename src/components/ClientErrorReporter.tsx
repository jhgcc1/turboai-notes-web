"use client";

import { useEffect } from "react";

import { reportClientError } from "@/lib/clientError";

/**
 * Installs window error hooks once. Reporting is fire-and-forget; failures
 * are swallowed so the reporter never cascades into another error loop.
 */
export function ClientErrorReporter() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      void reportClientError({
        message: event.message || "window.onerror",
        stack: event.error instanceof Error ? event.error.stack : undefined,
        source: "window.onerror",
      });
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message =
        reason instanceof Error
          ? reason.message
          : typeof reason === "string"
            ? reason
            : "unhandledrejection";
      const stack = reason instanceof Error ? reason.stack : undefined;
      void reportClientError({ message, stack, source: "unhandledrejection" });
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
