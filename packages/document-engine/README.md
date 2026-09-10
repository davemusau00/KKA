# Document engine workspace builds

`@kka/database` and `@kka/contracts` export compiled JavaScript and declarations from `dist`. A clean install generates Prisma source, but does not generate those workspace declarations.

The engine declares both dependencies as TypeScript project references. The shared projects are composite builds, with build metadata inside their ignored `dist` directories. Source roots and runtime package exports remain unchanged.

- `pnpm typecheck` first builds `tsconfig.packages.json` in dependency order, then checks all workspaces. This is the command used by predeployment CI.
- `pnpm --filter @kka/document-engine typecheck` builds its two referenced dependencies before checking the engine without emitting it.
- `pnpm --filter @kka/document-engine build` uses TypeScript build mode to build references before the engine.

Run `pnpm install --frozen-lockfile` first so the Prisma source generator has run. Do not depend on local `dist` leftovers or add source aliases that pull sibling packages outside the engine's `rootDir`.
