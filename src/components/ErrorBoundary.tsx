"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

import { reportClientError } from "@/lib/clientError";

type Props = { children: ReactNode };
type State = { hasError: boolean };

/**
 * Root React error boundary. Reports error + componentStack via the same
 * client-error API used by window.onerror (backend logs ERROR → CloudWatch →
 * triage Lambda → MiniMax → Jira). Does not call any LLM from the browser.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    const componentStack = info.componentStack?.trim() ?? "";
    const stack = [
      error.stack ?? "",
      componentStack ? `\nReact componentStack:\n${componentStack}` : "",
    ]
      .join("")
      .trim();
    void reportClientError({
      message: error.message || "React render error",
      stack: stack || undefined,
      source: "boundary",
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center px-4 text-center">
          <div>
            <h1 className="font-display text-2xl font-bold text-[var(--ink)]">
              Something went wrong
            </h1>
            <p className="mt-2 text-[var(--muted)]">Refresh the page to try again.</p>
            <button
              type="button"
              className="mt-6 rounded-full bg-[var(--btn)] px-6 py-3 font-semibold text-[var(--ink)]"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
