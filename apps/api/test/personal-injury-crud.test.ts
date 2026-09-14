import test from "node:test";
import assert from "node:assert/strict";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { PersonalInjuryService } from "../src/modules/personal-injury/personal-injury.service";

function fixture(canView = true) {
  const calls: any[] = [];
  const deletes: any[] = [];
  const updates: any[] = [];

  const prisma = {
    client: {
      matter: { findFirst: async () => ({ id: "matter-1", firmId: "firm-1", practiceArea: "Personal Injury" }) },
      user: {
        findFirst: async () => ({
          id: "user-1", firmId: "firm-1", email: "user@example.test", fullName: "User One", homeBranchId: null,
          roles: [{ role: { firmId: "firm-1", key: "advocate", active: true, permissions: [{ permission: { key: "matter.edit" } }] } }]
        })
      },
      personalInjuryCase: {
        upsert: async () => ({ id: "pi-1", matterId: "matter-1" }),
        findUnique: async () => ({ id: "pi-1", matterId: "matter-1" })
      },
      piVehicle: {
        findFirst: async ({ where }: any) => where.id === "veh-1" ? { id: "veh-1", registrationNo: "KAA 123A", personalInjuryId: "pi-1" } : null,
        delete: async (args: any) => { deletes.push({ table: "piVehicle", ...args }); return { id: args.where.id }; }
      },
      piWitness: {
        findFirst: async ({ where }: any) => where.id === "wit-1" ? { id: "wit-1", name: "John Witness", personalInjuryId: "pi-1" } : null,
        delete: async (args: any) => { deletes.push({ table: "piWitness", ...args }); return { id: args.where.id }; }
      },
      piInjury: {
        findFirst: async ({ where }: any) => where.id === "inj-1" ? { id: "inj-1", description: "Fracture", personalInjuryId: "pi-1" } : null,
        delete: async (args: any) => { deletes.push({ table: "piInjury", ...args }); return { id: args.where.id }; }
      },
      piMedicalReportRequest: {
        findFirst: async ({ where }: any) => where.id === "rep-1" ? { id: "rep-1", doctorName: "Dr. Kamau", personalInjuryId: "pi-1" } : null,
        delete: async (args: any) => { deletes.push({ table: "piMedicalReportRequest", ...args }); return { id: args.where.id }; }
      },
      piEvidenceItem: {
        findFirst: async ({ where }: any) => where.id === "ev-1" ? { id: "ev-1", title: "Abstract", category: "Police", personalInjuryId: "pi-1" } : null,
        delete: async (args: any) => { deletes.push({ table: "piEvidenceItem", ...args }); return { id: args.where.id }; }
      },
      piTreatmentEpisode: {
        findFirst: async ({ where }: any) => where.id === "treat-1" ? { id: "treat-1", facilityName: "KNH", personalInjuryId: "pi-1" } : null,
        delete: async (args: any) => { deletes.push({ table: "piTreatmentEpisode", ...args }); return { id: args.where.id }; }
      },
      piNegotiationEntry: {
        findFirst: async ({ where }: any) => where.id === "neg-1" ? { id: "neg-1", party: "INSURER", amount: 1000000, personalInjuryId: "pi-1" } : null,
        delete: async (args: any) => { deletes.push({ table: "piNegotiationEntry", ...args }); return { id: args.where.id }; }
      },
      piRecoveryAction: {
        findFirst: async ({ where }: any) => where.id === "rec-1" ? { id: "rec-1", actionType: "DEMAND", personalInjuryId: "pi-1" } : null,
        delete: async (args: any) => { deletes.push({ table: "piRecoveryAction", ...args }); return { id: args.where.id }; }
      },
      piSettlementDistribution: {
        findUnique: async () => ({ id: "set-1", personalInjuryId: "pi-1", grossAmount: 1500000, netClientAmount: 1200000 }),
        update: async (args: any) => { updates.push({ table: "piSettlementDistribution", ...args }); return { id: "set-1", ...args.data }; }
      }
    }
  };
  const audit = { record: async (event: any) => calls.push({ audit: event }) };
  const access = { canViewMatter: async () => canView };
  return { service: new PersonalInjuryService(prisma as any, audit as any, access as any), calls, deletes, updates };
}

test("deleteVehicle deletes vehicle row and records audit event", async () => {
  const { service, calls, deletes } = fixture(true);
  const result = await service.deleteVehicle("firm-1", "user-1", "matter-1", "veh-1");
  assert.equal(result.success, true);
  assert.equal(deletes.length, 1);
  assert.equal(deletes[0].where.id, "veh-1");
  assert.equal(calls.some(c => c.audit?.action === "pi.vehicle_deleted" && c.audit?.entityId === "veh-1"), true);
});

test("deleteVehicle throws NotFoundException if vehicle does not exist", async () => {
  const { service } = fixture(true);
  await assert.rejects(
    service.deleteVehicle("firm-1", "user-1", "matter-1", "veh-nonexistent"),
    (err: any) => err instanceof NotFoundException
  );
});

test("deleteWitness deletes witness row and records audit event", async () => {
  const { service, calls, deletes } = fixture(true);
  const result = await service.deleteWitness("firm-1", "user-1", "matter-1", "wit-1");
  assert.equal(result.success, true);
  assert.equal(deletes.some(d => d.where.id === "wit-1"), true);
  assert.equal(calls.some(c => c.audit?.action === "pi.witness_deleted"), true);
});

test("deleteInjury deletes injury row and records audit event", async () => {
  const { service, calls, deletes } = fixture(true);
  const result = await service.deleteInjury("firm-1", "user-1", "matter-1", "inj-1");
  assert.equal(result.success, true);
  assert.equal(deletes.some(d => d.where.id === "inj-1"), true);
  assert.equal(calls.some(c => c.audit?.action === "pi.injury_deleted"), true);
});

test("deleteMedicalReport deletes report request and records audit event", async () => {
  const { service, calls, deletes } = fixture(true);
  const result = await service.deleteMedicalReport("firm-1", "user-1", "matter-1", "rep-1");
  assert.equal(result.success, true);
  assert.equal(deletes.some(d => d.where.id === "rep-1"), true);
  assert.equal(calls.some(c => c.audit?.action === "pi.medical_report_deleted"), true);
});

test("deleteNegotiation deletes offer entry and records audit event", async () => {
  const { service, calls, deletes } = fixture(true);
  const result = await service.deleteNegotiation("firm-1", "user-1", "matter-1", "neg-1");
  assert.equal(result.success, true);
  assert.equal(deletes.some(d => d.where.id === "neg-1"), true);
  assert.equal(calls.some(c => c.audit?.action === "pi.negotiation_deleted"), true);
});

test("disburseSettlement records disbursement date, payment details, and audit event", async () => {
  const { service, calls, updates } = fixture(true);
  const result = await service.disburseSettlement("firm-1", "user-1", "matter-1", {
    paymentMethod: "RTGS",
    paymentReference: "RTGS-9921"
  });
  assert.equal(result.paymentMethod, "RTGS");
  assert.equal(result.paymentReference, "RTGS-9921");
  assert.equal(updates.length, 1);
  assert.equal(calls.some(c => c.audit?.action === "pi.settlement_disbursed"), true);
});
