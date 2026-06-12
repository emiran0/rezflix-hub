import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// `server-only` throws when imported outside a Server Component; stub it for the test.
vi.mock("server-only", () => ({}));
// `next/headers` isn't available in the test env; mock it so clientIp() is testable.
vi.mock("next/headers", () => ({ headers: vi.fn() }));

import { headers } from "next/headers";

import { clientIp, rateLimit } from "@/lib/rate-limit";

const headersMock = vi.mocked(headers);

function mockHeaders(map: Record<string, string>) {
  headersMock.mockResolvedValue({
    get: (k: string) => map[k.toLowerCase()] ?? null,
  } as unknown as Awaited<ReturnType<typeof headers>>);
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

const opts = { limit: 3, windowMs: 60_000 };

describe("rateLimit", () => {
  it("allows up to the limit then blocks", () => {
    const key = `t1:${Math.random()}`;
    expect(rateLimit(key, opts).success).toBe(true);
    expect(rateLimit(key, opts).success).toBe(true);
    expect(rateLimit(key, opts).success).toBe(true);

    const blocked = rateLimit(key, opts);
    expect(blocked.success).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it("resets after the window elapses", () => {
    const key = `t2:${Math.random()}`;
    rateLimit(key, opts);
    rateLimit(key, opts);
    rateLimit(key, opts);
    expect(rateLimit(key, opts).success).toBe(false);

    vi.advanceTimersByTime(60_001);
    expect(rateLimit(key, opts).success).toBe(true);
  });

  it("tracks keys independently", () => {
    const a = `a:${Math.random()}`;
    const b = `b:${Math.random()}`;
    rateLimit(a, opts);
    rateLimit(a, opts);
    rateLimit(a, opts);
    expect(rateLimit(a, opts).success).toBe(false);
    // A different key has its own fresh budget.
    expect(rateLimit(b, opts).success).toBe(true);
  });
});

describe("clientIp", () => {
  it("prefers x-real-ip (the unforgeable proxy-set peer)", async () => {
    mockHeaders({
      "x-real-ip": "203.0.113.7",
      // Even with a spoofed leftmost XFF, x-real-ip wins.
      "x-forwarded-for": "evil-spoof, 203.0.113.7",
    });
    expect(await clientIp()).toBe("203.0.113.7");
  });

  it("falls back to the rightmost x-forwarded-for hop", async () => {
    // Caddy appends the real peer, so the last entry is trustworthy; the leftmost
    // ("evil-spoof") is client-supplied and must be ignored.
    mockHeaders({ "x-forwarded-for": "evil-spoof, 198.51.100.9" });
    expect(await clientIp()).toBe("198.51.100.9");
  });

  it('falls back to "local" with no proxy headers', async () => {
    mockHeaders({});
    expect(await clientIp()).toBe("local");
  });
});
