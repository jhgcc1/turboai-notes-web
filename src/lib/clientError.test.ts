import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { _resetClientErrorGateForTests, reportClientError } from "./clientError";

vi.mock("./api", () => ({
  api: {
    reportClientError: vi.fn(async () => ({ detail: "recorded", fingerprint: "abc" })),
  },
}));

import { api } from "./api";

describe("reportClientError", () => {
  beforeEach(() => {
    _resetClientErrorGateForTests();
    vi.mocked(api.reportClientError).mockClear();
    vi.stubGlobal("window", {
      location: { href: "https://app.example/notes" },
    });
    vi.stubGlobal("navigator", { userAgent: "VitestUA" });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    _resetClientErrorGateForTests();
  });

  it("posts capped payload via api", async () => {
    await reportClientError({
      message: "boom",
      stack: "stack",
      source: "window.onerror",
    });
    expect(api.reportClientError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "boom",
        stack: "stack",
        url: "https://app.example/notes",
        user_agent: "VitestUA",
        source: "window.onerror",
      }),
    );
  });

  it("rate-limits rapid successive reports", async () => {
    await reportClientError({ message: "one" });
    await reportClientError({ message: "two" });
    expect(api.reportClientError).toHaveBeenCalledTimes(1);
  });

  it("swallows api failures", async () => {
    vi.mocked(api.reportClientError).mockRejectedValueOnce(new Error("network"));
    await expect(reportClientError({ message: "x" })).resolves.toBeUndefined();
  });

  it("truncates oversized message and stack", async () => {
    await reportClientError({
      message: "m".repeat(3000),
      stack: "s".repeat(9000),
    });
    const arg = vi.mocked(api.reportClientError).mock.calls[0][0];
    expect(arg.message.length).toBe(2000);
    expect(arg.stack ?? "").toHaveLength(8000);
  });

  it("no-ops when window is undefined", async () => {
    vi.stubGlobal("window", undefined);
    await reportClientError({ message: "ssr" });
    expect(api.reportClientError).not.toHaveBeenCalled();
  });

  it("defaults empty message", async () => {
    await reportClientError({ message: "" });
    expect(api.reportClientError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "unknown client error" }),
    );
  });
});
