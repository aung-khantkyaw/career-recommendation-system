# -----------------------------
# Base Stage
# -----------------------------
FROM node:26-alpine AS base
WORKDIR /app

# -----------------------------
# Development Stage
# -----------------------------
FROM base AS development
RUN apk add --no-cache python3 make g++ libc6-compat

COPY package.json package-lock.json* ./

RUN --mount=type=cache,target=/root/.npm \
    npm install

COPY . .
RUN npx prisma generate

ENV NODE_ENV=development
EXPOSE 3000
CMD ["npm", "run", "dev"]

# -----------------------------
# Dependencies Stage (For Production Build)
# -----------------------------
FROM base AS deps
RUN apk add --no-cache python3 make g++ libc6-compat
COPY package.json package-lock.json* ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci

# -----------------------------
# Builder Stage
# -----------------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

RUN npx prisma generate
RUN npm run build

# -----------------------------
# Production Stage (Runner)
# -----------------------------
FROM base AS production

ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]