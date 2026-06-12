import "server-only";

import { headers } from "next/headers";

// Basic fixed-window rate limiter (ARCHITECTURE §7). Process-local, in-memory — fine for
// the single v1 app container; counters reset on restart, which the spec accepts. Move to
// Redis only if we ever scale horizontally. Not a WAF; just enough to blunt credential
// stuffing and signup spam.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

// Opportunistic cleanup so distinct keys (IPs) don't accumulate forever. Runs at most
// once a minute, on the back of a normal call — no timers/intervals to leak.
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitResult = {
  success: boolean;
  /** Seconds until the window resets; 0 when not limited. */
  retryAfterSeconds: number;
};

export function rateLimit(
  key: string,
  opts: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { success: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= opts.limit) {
    return {
      success: false,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count += 1;
  return { success: true, retryAfterSeconds: 0 };
}

// Best-effort client IP from proxy headers, for coarse throttling only — never an
// authorization signal. Trust ordering matters: the *leftmost* `x-forwarded-for` entry is
// client-supplied and trivially spoofable (rotate it → fresh bucket each request), so we
// never key off it.
//
//  1. `x-real-ip` — our Caddy relay sets this to the real TCP peer
//     (`header_up X-Real-IP {remote_host}`, see infra/Caddyfile.snippet); unforgeable.
//  2. else the *rightmost* `x-forwarded-for` hop — Caddy appends the connecting peer, so
//     the last entry is the IP it actually observed (the leftmost ones are attacker input).
//  3. else `"local"` — dev has no proxy; the limiter still works, just globally.
export async function clientIp(): Promise<string> {
  const h = await headers();

  const realIp = h.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    if (hops.length > 0) return hops[hops.length - 1]!;
  }

  return "local";
}
