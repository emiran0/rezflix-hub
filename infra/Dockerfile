# Production image for the REZFLIX Hub (Next.js standalone output).
# Requires `output: "standalone"` in next.config — Phase 0 / Phase 8 should set that.

# 1. Dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# 2. Build
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate Prisma client, then build. Build-time vars that are public can be passed here.
RUN npx prisma generate && npm run build

# 3. Runtime (minimal)
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Run as non-root.
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Prisma needs its schema + engine at runtime for `migrate deploy` if run in-container.
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
