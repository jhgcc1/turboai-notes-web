import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ErrorBoundary } from "./ErrorBoundary";

const reportClientError = vi.fn(async (_payload?: unknown) => undefined);

vi.mock("@/lib/clientError", () => ({
  reportClientError: (payload: unknown) => reportClientError(payload),
}));

function Boom(): ReactElement {
  throw new Error("render boom");
}

describe("ErrorBoundary", () => {
  beforeEach(() => {
    reportClientError.mockClear();
    // React logs boundary errors to console.error — silence noise.
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("reports error with componentStack and shows fallback UI", async () => {
    const user = userEvent.setup();
    const reload = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { reload },
    });

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );

    expect(await screen.findByText("Something went wrong")).toBeInTheDocument();
    expect(reportClientError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "render boom",
        source: "boundary",
      }),
    );
    const stack = reportClientError.mock.calls[0]?.[0] as { stack?: string };
    expect(stack.stack ?? "").toContain("React componentStack");

    await user.click(screen.getByRole("button", { name: "Reload" }));
    expect(reload).toHaveBeenCalled();
  });

  it("handles errors without stack or message", () => {
    function BareBoom(): ReactElement {
      const err = new Error("");
      err.stack = undefined;
      throw err;
    }
    render(
      <ErrorBoundary>
        <BareBoom />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(reportClientError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "React render error",
        source: "boundary",
      }),
    );
  });

  it("omits stack when error and componentStack are empty", () => {
    const boundary = new ErrorBoundary({ children: null });
    const err = new Error("");
    err.stack = "";
    boundary.componentDidCatch(err, { componentStack: undefined } as never);
    expect(reportClientError).toHaveBeenCalledWith({
      message: "React render error",
      stack: undefined,
      source: "boundary",
    });
  });

  it("uses empty componentStack branch without appending", () => {
    const boundary = new ErrorBoundary({ children: null });
    const err = new Error("x");
    err.stack = "Error: x";
    boundary.componentDidCatch(err, { componentStack: "   " } as never);
    expect(reportClientError).toHaveBeenCalledWith({
      message: "x",
      stack: "Error: x",
      source: "boundary",
    });
  });

  it("renders children when healthy", () => {
    render(
      <ErrorBoundary>
        <p>ok</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText("ok")).toBeInTheDocument();
    expect(reportClientError).not.toHaveBeenCalled();
  });
});
