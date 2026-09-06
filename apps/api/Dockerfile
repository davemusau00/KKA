FROM node:26-bookworm-slim
RUN npm install -g pnpm@10.15.1
WORKDIR /app
RUN corepack enable
COPY package.json package.json
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
COPY apps/api ./apps/api
RUN pnpm --filter @kka/contracts build && pnpm --filter @kka/database build && pnpm --filter @kka/api build

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN corepack enable
COPY --from=build /app /app
USER node
CMD ["node", "apps/api/dist/main.js"]
