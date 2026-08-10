import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "./api";
import { reportUnexpected } from "./reportUnexpected";

const { reportClientError } = vi.hoisted(() => ({
  reportClientError: vi.fn(async (_payload?: unknown) => undefined),
}));

vi.mock("./clientError", () => ({
  reportClientError: (payload: unknown) => reportClientError(payload),
  _resetClientErrorGateForTests: vi.fn(),
}));

describe("reportUnexpected", () => {
  beforeEach(() => {
    reportClientError.mockClear();
  });

  it("skips expected ApiError statuses", () => {
    for (const status of [400, 401, 403, 404, 409, 422, 429]) {
      reportUnexpected(new ApiError(status, {}), "test");
    }
    expect(reportClientError).not.toHaveBeenCalled();
  });

  it("reports unexpected ApiError 5xx", () => {
    const err = new ApiError(500, { detail: "boom" });
    reportUnexpected(err, "NotesHome.load");
    expect(reportClientError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "ApiError 500: API error 500",
        source: "NotesHome.load",
        stack: err.stack,
      }),
    );
  });

  it("reports generic Error", () => {
    const err = new Error("network down");
    reportUnexpected(err, "AuthForm.submit");
    expect(reportClientError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "network down",
        source: "AuthForm.submit",
      }),
    );
  });

  it("defaults empty Error message", () => {
    reportUnexpected(new Error(""), "x");
    expect(reportClientError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "unexpected error", source: "x" }),
    );
  });

  it("reports string throws", () => {
    reportUnexpected("weird", "x");
    expect(reportClientError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "weird", source: "x" }),
    );
  });

  it("reports unknown non-Error throws", () => {
    reportUnexpected({ oops: true }, "x");
    expect(reportClientError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "unexpected non-Error throw", source: "x" }),
    );
  });
});
