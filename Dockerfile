# Production image. Build & run:
#   docker compose --profile app up -d --build
# Migrations run by the one-shot `migrate` compose service (build stage has
# the full Prisma CLI); the app container only runs the standalone server.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Placeholder so the build doesn't require the real secret; the runtime
# value comes from the container environment (see docker-compose.yml).
ENV AUTH_SECRET=build-placeholder
RUN npx prisma generate && npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Next standalone server (self-contained node_modules) + static assets
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
# The About/Terms/Privacy page reads this at request time (src/lib/legal.ts)
# — it's outside .next/standalone's own file-tracing since marked reads it
# via fs, not an import.
COPY --from=build /app/docs/legal ./docs/legal

EXPOSE 3000
CMD ["node", "server.js"]
