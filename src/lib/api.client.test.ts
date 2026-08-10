import { ApiError, api, _resetCsrfTokenForTests } from "./api";

describe("api client", () => {
  beforeEach(() => {
    _resetCsrfTokenForTests();
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
        if (String(url).includes("/api/auth/csrf/")) {
          return new Response(
            JSON.stringify({ detail: "CSRF cookie set", csrfToken: "from-api" }),
            {
              status: 200,
            },
          );
        }
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    _resetCsrfTokenForTests();
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
    _resetCsrfTokenForTests();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (String(url).includes("/api/auth/csrf/")) {
          return new Response(
            JSON.stringify({ detail: "CSRF cookie set", csrfToken: "body-token" }),
            {
              status: 200,
            },
          );
        }
        return new Response(JSON.stringify({ id: 1, email: "a@b.com" }), { status: 200 });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.cookie = "csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    _resetCsrfTokenForTests();
  });

  it("sends X-CSRFToken on mutating requests when the cookie is set", async () => {
    document.cookie = "csrftoken=abc123";
    await api.login("a@b.com", "pass");
    const loginCall = vi.mocked(fetch).mock.calls.find(([url]) => String(url).includes("/login/"));
    expect(new Headers(loginCall?.[1]?.headers).get("X-CSRFToken")).toBe("abc123");
  });

  it("sends X-CSRFToken from csrf() response body when cookie is unreadable", async () => {
    await api.csrf();
    await api.logout();
    const logoutCall = vi
      .mocked(fetch)
      .mock.calls.find(([url]) => String(url).includes("/logout/"));
    expect(new Headers(logoutCall?.[1]?.headers).get("X-CSRFToken")).toBe("body-token");
  });

  it("csrf() tolerates a response without csrfToken", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: "CSRF cookie set" }), { status: 200 }),
    );
    await expect(api.csrf()).resolves.toEqual({ detail: "CSRF cookie set" });
  });

  it("lazily fetches csrf token before mutating when memory and cookie are empty", async () => {
    await api.logout();
    const logoutCall = vi
      .mocked(fetch)
      .mock.calls.find(([url]) => String(url).includes("/logout/"));
    expect(new Headers(logoutCall?.[1]?.headers).get("X-CSRFToken")).toBe("body-token");
    expect(vi.mocked(fetch).mock.calls.some(([url]) => String(url).includes("/csrf/"))).toBe(true);
  });

  it("omits X-CSRFToken on mutating requests when no token is available", async () => {
    vi.mocked(fetch).mockImplementation(async (input: RequestInfo | URL) => {
      if (String(input).includes("/api/auth/csrf/")) {
        return new Response(JSON.stringify({ detail: "CSRF cookie set" }), { status: 200 });
      }
      return new Response(JSON.stringify({ id: 1, email: "a@b.com" }), { status: 200 });
    });
    await api.login("a@b.com", "pass");
    const loginCall = vi.mocked(fetch).mock.calls.find(([url]) => String(url).includes("/login/"));
    expect(new Headers(loginCall?.[1]?.headers).get("X-CSRFToken")).toBeNull();
  });

  it("tolerates non-JSON csrf bootstrap responses", async () => {
    vi.mocked(fetch).mockImplementation(async (input: RequestInfo | URL) => {
      if (String(input).includes("/api/auth/csrf/")) {
        return new Response("not-json", { status: 200 });
      }
      return new Response(JSON.stringify({ id: 1, email: "a@b.com" }), { status: 200 });
    });
    await api.login("a@b.com", "pass");
    const loginCall = vi.mocked(fetch).mock.calls.find(([url]) => String(url).includes("/login/"));
    expect(new Headers(loginCall?.[1]?.headers).get("X-CSRFToken")).toBeNull();
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
