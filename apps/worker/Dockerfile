FROM node:24-bookworm-slim AS deps
WORKDIR /app
RUN corepack enable
COPY package.monorepo.json package.json
COPY pnpm-workspace.yaml tsconfig.base.json prisma.config.ts ./
COPY apps/api/package.json apps/api/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/database/package.json packages/database/package.json
COPY prisma ./prisma
RUN pnpm install --no-frozen-lockfile
COPY packages ./packages
RUN pnpm prisma:generate

FROM deps AS build
COPY apps/worker ./apps/worker
RUN pnpm --filter @kka/database build && pnpm --filter @kka/worker build

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN corepack enable
COPY --from=build /app /app
USER node
CMD ["node", "apps/worker/dist/main.js"]
