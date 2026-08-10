import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ClientErrorReporter } from "./ClientErrorReporter";

const reportClientError = vi.fn(async (_payload?: unknown) => undefined);

vi.mock("@/lib/clientError", () => ({
  reportClientError: (payload: unknown) => reportClientError(payload),
}));

describe("ClientErrorReporter", () => {
  beforeEach(() => {
    reportClientError.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("wires window error and rejection listeners", () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    const { unmount } = render(<ClientErrorReporter />);
    expect(add).toHaveBeenCalledWith("error", expect.any(Function));
    expect(add).toHaveBeenCalledWith("unhandledrejection", expect.any(Function));

    const onError = add.mock.calls.find((c) => c[0] === "error")?.[1] as EventListener;
    onError(new ErrorEvent("error", { message: "boom", error: new Error("boom") }));
    expect(reportClientError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "boom", source: "window.onerror" }),
    );

    onError(new ErrorEvent("error", { message: "", error: null }));
    expect(reportClientError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "window.onerror", source: "window.onerror" }),
    );

    const onRejection = add.mock.calls.find(
      (c) => c[0] === "unhandledrejection",
    )?.[1] as EventListener;
    onRejection(
      new PromiseRejectionEvent("unhandledrejection", {
        promise: Promise.resolve(),
        reason: new Error("rej"),
      }),
    );
    expect(reportClientError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "rej", source: "unhandledrejection" }),
    );

    onRejection(
      new PromiseRejectionEvent("unhandledrejection", {
        promise: Promise.resolve(),
        reason: "string-rej",
      }),
    );
    expect(reportClientError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "string-rej", source: "unhandledrejection" }),
    );

    onRejection(
      new PromiseRejectionEvent("unhandledrejection", {
        promise: Promise.resolve(),
        reason: { weird: true },
      }),
    );
    expect(reportClientError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "unhandledrejection", source: "unhandledrejection" }),
    );

    unmount();
    expect(remove).toHaveBeenCalledWith("error", expect.any(Function));
    expect(remove).toHaveBeenCalledWith("unhandledrejection", expect.any(Function));
  });
});
