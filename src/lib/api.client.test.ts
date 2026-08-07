import { ApiError, api } from "./api";

describe("api client", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        if (String(url).includes("/api/auth/me/")) {
          return new Response(JSON.stringify({ id: 1, email: "a@b.com", date_joined: "" }), {
            status: 200,
          });
        }
        if (String(url).includes("/api/notes/") && init?.method === "DELETE") {
          return new Response(null, { status: 204 });
        }
        if (String(url).includes("/api/auth/login/")) {
          return new Response(JSON.stringify({ detail: "bad" }), { status: 400 });
        }
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("constructs ApiError", () => {
    const err = new ApiError(418, { detail: "nope" });
    expect(err.status).toBe(418);
    expect(err.message).toContain("418");
    expect(err.body).toEqual({ detail: "nope" });
  });

  it("me succeeds", async () => {
    const user = await api.me();
    expect(user.email).toBe("a@b.com");
  });

  it("delete handles 204", async () => {
    await expect(api.deleteNote(1)).resolves.toBeUndefined();
  });

  it("throws ApiError", async () => {
    await expect(api.login("a", "b")).rejects.toBeInstanceOf(ApiError);
  });

  it("notes with category query", async () => {
    await api.notes(3);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("category=3"), expect.any(Object));
  });

  it("handles invalid json body on error", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response("not-json", { status: 500 }));
    await expect(api.me()).rejects.toBeInstanceOf(ApiError);
  });

  it("csrf register logout create update", async () => {
    await api.csrf();
    await api.register("a@b.com", "pass");
    await api.logout();
    await api.categories();
    await api.notes();
    await api.getNote(1);
    await api.createNote({ title: "t", body: "b", category: 1 });
    await api.updateNote(1, { title: "x" });
  });
});

describe("CSRF header injection", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ id: 1, email: "a@b.com" }), { status: 200 })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.cookie = "csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  });

  it("sends X-CSRFToken on mutating requests when the cookie is set", async () => {
    document.cookie = "csrftoken=abc123";
    await api.login("a@b.com", "pass");
    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect(new Headers(init?.headers).get("X-CSRFToken")).toBe("abc123");
  });

  it("omits X-CSRFToken on mutating requests when no cookie is set", async () => {
    await api.login("a@b.com", "pass");
    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect(new Headers(init?.headers).get("X-CSRFToken")).toBeNull();
  });

  it("omits X-CSRFToken on safe (GET) requests even when the cookie is set", async () => {
    document.cookie = "csrftoken=abc123";
    await api.me();
    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect(new Headers(init?.headers).get("X-CSRFToken")).toBeNull();
  });

  it("skips cookie lookup when document is unavailable (SSR)", async () => {
    vi.stubGlobal("document", undefined);
    await expect(api.login("a@b.com", "pass")).resolves.toBeTruthy();
  });
});
