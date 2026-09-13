import "reflect-metadata";
import test from "node:test";
import assert from "node:assert/strict";
import { ServiceUnavailableException } from "@nestjs/common";
import { FeatureFlagsService } from "../src/platform/features/feature-flags.service";
import { FeatureFlagsGuard } from "../src/platform/features/feature-flags.guard";
import { FEATURE_FLAG_KEY } from "../src/platform/features/feature-flags.decorator";
import { FinanceController } from "../src/modules/finance/finance.controller";
import { PortalController } from "../src/modules/portal/portal.controller";
import { WebsiteAdminController } from "../src/modules/website/website-admin.controller";

test("server feature flags default to enabled but an explicit disabled flag blocks the route", async () => {
  const disabled = new FeatureFlagsService({ client: { featureFlag: { findUnique: async () => ({ enabled: false }) } } } as any);
  const absent = new FeatureFlagsService({ client: { featureFlag: { findUnique: async () => null } } } as any);
  assert.equal(await absent.isEnabled("module.finance"), true);
  await assert.rejects(() => disabled.assertEnabled("module.finance"), (error: unknown) => error instanceof ServiceUnavailableException);
});

test("flag guard reads controller metadata before a flagged API handler executes", async () => {
  let checked = "";
  const guard = new FeatureFlagsGuard({ getAllAndOverride: () => "module.portal" } as any, { assertEnabled: async (key: string) => { checked = key; } } as any);
  assert.equal(await guard.canActivate({ getHandler: () => undefined, getClass: () => undefined } as any), true);
  assert.equal(checked, "module.portal");
  assert.equal(Reflect.getMetadata(FEATURE_FLAG_KEY, FinanceController), "module.finance");
  assert.equal(Reflect.getMetadata(FEATURE_FLAG_KEY, PortalController), "module.portal");
  assert.equal(Reflect.getMetadata(FEATURE_FLAG_KEY, WebsiteAdminController), "module.website");
});
