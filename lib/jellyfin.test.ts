import { afterEach, describe, expect, it, vi } from "vitest";

// `server-only` throws outside a Server Component; stub it for the test.
vi.mock("server-only", () => ({}));

import { createJellyfinClient, getJellyfinClient } from "@/lib/jellyfin";

const baseUrl = "http://10.0.0.1:8096";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createJellyfinClient.authenticateByName", () => {
  it("returns the Jellyfin user id on success and sends the right request", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ User: { Id: "jf-123", Name: "RezFan" } }),
      );
    const client = createJellyfinClient({
      baseUrl,
      clientName: "Rezflix",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const result = await client.authenticateByName("rezfan", "s3cret");

    expect(result).toEqual({
      ok: true,
      jellyfinUserId: "jf-123",
      jellyfinUsername: "RezFan",
    });

    // Correct endpoint, method, auth header, and JSON body shape.
    const [calledUrl, init] = fetchImpl.mock.calls[0];
    expect(calledUrl).toBe("http://10.0.0.1:8096/Users/AuthenticateByName");
    expect(init.method).toBe("POST");
    expect(init.headers["X-Emby-Authorization"]).toContain('Client="Rezflix"');
    expect(JSON.parse(init.body)).toEqual({ Username: "rezfan", Pw: "s3cret" });
  });

  it("never exposes the password beyond the request body", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(jsonResponse({ User: { Id: "jf-1" } }));
    const client = createJellyfinClient({
      baseUrl,
      clientName: "Rezflix",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const result = await client.authenticateByName("rezfan", "s3cret");
    // The result carries only ids/usernames — no password, no access token.
    expect(JSON.stringify(result)).not.toContain("s3cret");
  });

  it("maps 401 to invalid_credentials", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(new Response("", { status: 401 }));
    const client = createJellyfinClient({
      baseUrl,
      clientName: "Rezflix",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    await expect(client.authenticateByName("rezfan", "wrong")).resolves.toEqual(
      { ok: false, reason: "invalid_credentials" },
    );
  });

  it("maps a network error / abort to unreachable", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));
    const client = createJellyfinClient({
      baseUrl,
      clientName: "Rezflix",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    await expect(
      client.authenticateByName("rezfan", "s3cret"),
    ).resolves.toEqual({ ok: false, reason: "unreachable" });
  });

  it("aborts via timeout and maps to unreachable", async () => {
    // fetchImpl that hangs until the request signal aborts — exercises the
    // AbortController + timeoutMs wiring, not just a pre-rejected promise.
    const fetchImpl = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          );
        }),
    );
    const client = createJellyfinClient({
      baseUrl,
      clientName: "Rezflix",
      fetchImpl: fetchImpl as unknown as typeof fetch,
      timeoutMs: 5,
    });
    await expect(
      client.authenticateByName("rezfan", "s3cret"),
    ).resolves.toEqual({ ok: false, reason: "unreachable" });
  });

  it("maps a non-401 error status to unexpected", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(new Response("", { status: 500 }));
    const client = createJellyfinClient({
      baseUrl,
      clientName: "Rezflix",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    await expect(
      client.authenticateByName("rezfan", "s3cret"),
    ).resolves.toEqual({ ok: false, reason: "unexpected" });
  });

  it("treats a 200 with no User.Id as unexpected", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ User: {} }));
    const client = createJellyfinClient({
      baseUrl,
      clientName: "Rezflix",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    await expect(
      client.authenticateByName("rezfan", "s3cret"),
    ).resolves.toEqual({ ok: false, reason: "unexpected" });
  });

  it("normalizes a trailing slash on the base URL", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(jsonResponse({ User: { Id: "jf-1" } }));
    const client = createJellyfinClient({
      baseUrl: "http://10.0.0.1:8096/",
      clientName: "Rezflix",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    await client.authenticateByName("rezfan", "s3cret");
    expect(fetchImpl.mock.calls[0][0]).toBe(
      "http://10.0.0.1:8096/Users/AuthenticateByName",
    );
  });
});

describe("getJellyfinClient", () => {
  const original = process.env.JELLYFIN_INTERNAL_URL;
  afterEach(() => {
    if (original === undefined) delete process.env.JELLYFIN_INTERNAL_URL;
    else process.env.JELLYFIN_INTERNAL_URL = original;
  });

  it("throws a clear error when JELLYFIN_INTERNAL_URL is unset", () => {
    delete process.env.JELLYFIN_INTERNAL_URL;
    expect(() => getJellyfinClient()).toThrow(
      "JELLYFIN_INTERNAL_URL is not set",
    );
  });

  it("builds a client when the env var is set", () => {
    process.env.JELLYFIN_INTERNAL_URL = baseUrl;
    expect(getJellyfinClient()).toHaveProperty("authenticateByName");
  });
});
