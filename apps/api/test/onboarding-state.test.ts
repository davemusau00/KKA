import test from "node:test";
import assert from "node:assert/strict";
import { BadRequestException } from "@nestjs/common";
import { AuthService } from "../src/modules/auth/auth.service";

const user = { id: "user-1", firmId: "firm-1" };

function onboardingService() {
  let state: any = null;
  const audits: any[] = [];
  const tx = {
    userOnboardingState: {
      findUnique: async () => state,
      upsert: async (input: any) => {
        state = {
          id: state?.id ?? "onboarding-1",
          userId: user.id,
          onboardingVersion: 1,
          status: "NOT_STARTED",
          currentStepKey: null,
          completedSteps: [],
          startedAt: null,
          lastSeenAt: null,
          completedAt: null,
          tourCompletedAt: null,
          manualViewedAt: null,
          dismissedUntil: null,
          ...(state ?? input.create),
          ...(state ? input.update : {})
        };
        return state;
      }
    }
  };
  const prisma = { client: { userOnboardingState: { findUnique: async () => state }, $transaction: async (work: any) => work(tx) } };
  const audit = { record: async (input: any) => { audits.push(input); return { id: `audit-${audits.length}` }; } };
  return { service: new AuthService(prisma as any, {} as any, audit as any), audits, state: () => state };
}

test("onboarding reads an explicit default without creating business state", async () => {
  const { service, state } = onboardingService();
  const result = await service.onboardingState(user.id);
  assert.equal(result.status, "NOT_STARTED");
  assert.deepEqual(result.completedSteps, []);
  assert.equal(state(), null);
});

test("onboarding steps persist, deduplicate, and return an audit reference", async () => {
  const { service, audits, state } = onboardingService();
  const first = await service.updateOnboarding(user, { action: "COMPLETE_STEP", stepKey: "VERIFY_PROFILE" });
  assert.equal(first.state.status, "IN_PROGRESS");
  assert.deepEqual(first.state.completedSteps, ["VERIFY_PROFILE"]);
  assert.equal(first.auditId, "audit-1");

  await service.updateOnboarding(user, { action: "COMPLETE_STEP", stepKey: "VERIFY_PROFILE", currentStepKey: "ROLE_BRANCH" });
  assert.deepEqual(state().completedSteps, ["VERIFY_PROFILE"]);
  assert.equal(state().currentStepKey, "ROLE_BRANCH");
  assert.equal(audits[1].action, "auth.onboarding_complete_step");
});

test("onboarding completion and postponement use explicit timestamps", async () => {
  const { service, state } = onboardingService();
  const future = new Date(Date.now() + 60_000).toISOString();
  await service.updateOnboarding(user, { action: "POSTPONE", dismissedUntil: future });
  assert.equal(new Date(state().dismissedUntil).toISOString(), future);
  const done = await service.updateOnboarding(user, { action: "COMPLETE" });
  assert.equal(done.state.status, "COMPLETED");
  assert.equal(done.state.currentStepKey, "READY_FOR_WORK");
  assert.ok(done.state.completedAt);
  await assert.rejects(() => service.updateOnboarding(user, { action: "POSTPONE", dismissedUntil: new Date(Date.now() - 60_000).toISOString() }), BadRequestException);
});
