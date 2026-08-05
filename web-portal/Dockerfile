FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++ libc6-compat

COPY package.json package-lock.json* ./

RUN npm ci

COPY . .

ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN npx prisma generate
RUN npm run build

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --chown=nextjs:nodejs .next/standalone ./
COPY --chown=nextjs:nodejs .next/static ./.next/static
COPY --chown=nextjs:nodejs public ./public

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]