import "server-only"
import { PrismaClient } from "@prisma/client"

// Single PrismaClient instance, reused across hot-reloads in dev so we don't exhaust
// the connection pool. `import "server-only"` makes an accidental client-component import a
// hard build error instead of silently bundling the DB client into the browser (boundary rule).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
