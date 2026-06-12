import "server-only";

// Server-side Jellyfin client for the "Link Jellyfin Account" proof-of-ownership step
// (ARCHITECTURE §5.3). We call `AuthenticateByName` over the **Tailnet** IP
// (`JELLYFIN_INTERNAL_URL`) as the user, purely to prove they own that Jellyfin account —
// then discard the result. NO Jellyfin plugin and NO admin/API token are involved; the
// returned AccessToken is intentionally ignored and never stored. The Jellyfin password
// is sent once over the private network and never logged or persisted.
//
// The client is built via a factory so callers (and tests) can inject `fetchImpl`/config —
// nothing here reads `globalThis.fetch` or env implicitly except the env-backed default.

export type JellyfinAuthResult =
  | { ok: true; jellyfinUserId: string; jellyfinUsername: string }
  | { ok: false; reason: "invalid_credentials" | "unreachable" | "unexpected" };

export interface JellyfinClientConfig {
  /** Base URL incl. scheme + port, e.g. http://<tailnet-ip>:8096 */
  baseUrl: string;
  /** Identifies the hub in the X-Emby-Authorization header. */
  clientName: string;
  /** Injectable for tests; defaults to global fetch. */
  fetchImpl?: typeof fetch;
  /** Abort the request after this long so an unreachable server fails fast. */
  timeoutMs?: number;
}

export interface JellyfinClient {
  authenticateByName(
    username: string,
    password: string,
  ): Promise<JellyfinAuthResult>;
}

// Jellyfin expects an `X-Emby-Authorization` header even on AuthenticateByName. DeviceId is
// constant on purpose — this is a one-shot verification, not a persistent device session.
function buildAuthHeader(clientName: string): string {
  // The value is interpolated into quoted fields, so strip any quotes/commas to keep the
  // header well-formed. clientName is operator-controlled env, so this is just belt-and-braces.
  const safe = clientName.replace(/["\\,]/g, "");
  return [
    `MediaBrowser Client="${safe}"`,
    `Device="${safe}"`,
    `DeviceId="${safe}"`,
    `Version="1.0.0"`,
  ].join(", ");
}

export function createJellyfinClient(
  config: JellyfinClientConfig,
): JellyfinClient {
  const doFetch = config.fetchImpl ?? fetch;
  const timeoutMs = config.timeoutMs ?? 8000;
  const url = `${config.baseUrl.replace(/\/+$/, "")}/Users/AuthenticateByName`;

  async function authenticateByName(
    username: string,
    password: string,
  ): Promise<JellyfinAuthResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let res: Response;
    try {
      res = await doFetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Emby-Authorization": buildAuthHeader(config.clientName),
        },
        body: JSON.stringify({ Username: username, Pw: password }),
        signal: controller.signal,
        cache: "no-store",
      });
    } catch {
      // Network error, DNS failure, or our own timeout abort → treat as unreachable.
      // Deliberately swallow the cause: it may reference the request (never log the body).
      return { ok: false, reason: "unreachable" };
    } finally {
      clearTimeout(timer);
    }

    if (res.status === 401) return { ok: false, reason: "invalid_credentials" };
    if (!res.ok) return { ok: false, reason: "unexpected" };

    try {
      const data = (await res.json()) as {
        User?: { Id?: string; Name?: string };
      };
      const id = data.User?.Id;
      if (!id) return { ok: false, reason: "unexpected" };
      return {
        ok: true,
        jellyfinUserId: id,
        jellyfinUsername: data.User?.Name ?? username,
      };
    } catch {
      return { ok: false, reason: "unexpected" };
    }
  }

  return { authenticateByName };
}

// Default client built from server-only env. Lazy (function, not module const) so a missing
// env var fails at call time with a clear message rather than crashing on import.
export function getJellyfinClient(): JellyfinClient {
  const baseUrl = process.env.JELLYFIN_INTERNAL_URL;
  if (!baseUrl) {
    throw new Error("JELLYFIN_INTERNAL_URL is not set");
  }
  return createJellyfinClient({
    baseUrl,
    clientName: process.env.JELLYFIN_CLIENT_NAME ?? "Rezflix",
  });
}
