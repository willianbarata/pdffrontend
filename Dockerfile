############################################
# Base
############################################
FROM node:20-alpine AS base

RUN apk add --no-cache libc6-compat openssl

WORKDIR /app


############################################
# Dependencies
############################################
FROM base AS deps

COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./

RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi


############################################
# Builder
############################################
FROM base AS builder

WORKDIR /app

# Copia dependências
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Gera Prisma Client (uma única vez)
RUN npx prisma generate

# Build Next.js standalone
RUN \
  if [ -f yarn.lock ]; then yarn run build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi


############################################
# Runner (produção)
############################################
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Apenas o necessário em runtime
RUN apk add --no-cache openssl

# Usuário não-root
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Arquivos públicos
COPY --from=builder /app/public ./public

# Diretórios que o Next usa
RUN mkdir -p public/videos .next \
 && chown -R nextjs:nodejs public .next

# Next standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma (schema)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Entrypoint
COPY --chown=nextjs:nodejs entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh

# Install global prisma to ensure we use the correct version (5.19.1) and NOT latest (7.x)
# This prevents incompatible schema validation errors
RUN npm install -g prisma@5.19.1

USER nextjs

ENTRYPOINT ["./entrypoint.sh"]

# Runtime: Use global prisma binary directly
# Removed seed execution as requested by user
CMD ["/bin/sh", "-c", "prisma db push --accept-data-loss --skip-generate && node server.js"]
