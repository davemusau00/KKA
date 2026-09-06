FROM node:26-bookworm-slim AS deps

WORKDIR /app

RUN npm install -g pnpm@10.15.1

COPY package.json ./
COPY pnpm-workspace.yaml tsconfig.base.json prisma.config.ts ./

COPY apps/api/package.json apps/api/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/document-engine/package.json packages/document-engine/package.json
COPY packages/database/package.json packages/database/package.json

COPY prisma ./prisma

RUN pnpm install --no-frozen-lockfile

COPY packages ./packages

RUN pnpm prisma:generate


FROM deps AS build

COPY apps/worker ./apps/worker

RUN pnpm --filter @kka/contracts build \
 && pnpm --filter @kka/database build \
 && pnpm --filter @kka/document-engine build \
 && pnpm --filter @kka/worker build


FROM node:26-bookworm-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends libreoffice-writer chromium fonts-liberation fonts-dejavu-core && rm -rf /var/lib/apt/lists/*
ENV LIBREOFFICE_PATH=/usr/bin/soffice CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium
ENV NODE_ENV=production
WORKDIR /app

RUN npm install -g pnpm@10.15.1

COPY --from=build /app /app

USER node

CMD ["node", "apps/worker/dist/main.js"]
