import "server-only";

// Admins are configured server-side, never self-served (ARCHITECTURE §5.4). `ADMIN_EMAILS`
// is a comma-separated allowlist; matching is case-insensitive and whitespace-tolerant so a
// stray space or capitalization in the env var doesn't silently lock an admin out. Unset or
// empty → nobody is an admin. Read only in server code; never exposed to the client.
export function isAdminEmail(email: string): boolean {
  const allow = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allow.includes(email.trim().toLowerCase());
}
