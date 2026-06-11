// Auth.js v5 route handlers (sign-in, callback, session, csrf, sign-out).
// The whole flow runs server-side; the browser only ever sees the httpOnly session cookie.
import { handlers } from "@/auth"

export const { GET, POST } = handlers
