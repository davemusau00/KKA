import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { FirmIdentityWrite, LegalEntityWrite, BranchContactWrite } from '@kka/contracts';
import { PrismaService } from "../../platform/prisma/prisma.service";
import { AuditService } from "../../platform/audit/audit.service";

@Injectable()
export class OrganizationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async profile(firmId: string) {
    const firm = await this.prisma.client.firm.findUnique({
      where: { id: firmId },
      select: {
        id: true, name: true, shortName: true, timezone: true, locale: true, currency: true, updatedAt: true,
        legalEntities: { orderBy: { name: 'asc' }, select: {
          id: true, name: true, registrationNo: true, kraPin: true, vatRegistration: true, active: true, updatedAt: true,
        } },
        branches: { orderBy: { code: 'asc' }, select: {
          id: true, name: true, code: true, address: true, postalAddress: true, phone: true, email: true, active: true, updatedAt: true,
        } },
      },
    });
    if (!firm) throw new NotFoundException('Firm not found');
    return firm;
  }

  private conflict() {
    return new ConflictException({ code: 'VERSION_CONFLICT', message: 'This record changed. Cancel editing, reload the profile and review the latest values before saving.' });
  }

  private nextTimestamp(previous: string) {
    return new Date(Math.max(Date.now(), new Date(previous).getTime() + 1));
  }

  async updateIdentity(firmId: string, actorId: string, input: FirmIdentityWrite) {
    const { expectedUpdatedAt, ...data } = input;
    return this.prisma.client.$transaction(async tx => {
      const result = await tx.firm.updateMany({ where: { id: firmId, updatedAt: new Date(expectedUpdatedAt) }, data: { ...data, updatedAt: this.nextTimestamp(expectedUpdatedAt) } });
      if (!result.count) throw this.conflict();
      await this.audit.record({ firmId, actorUserId: actorId, action: 'firm.identity_updated', entityType: 'firm', entityId: firmId,
        metadata: { changedKeys: Object.keys(data), previousUpdatedAt: expectedUpdatedAt } }, tx);
      return tx.firm.findUniqueOrThrow({ where: { id: firmId } });
    });
  }

  async updateLegalEntity(firmId: string, actorId: string, id: string, input: LegalEntityWrite) {
    const { expectedUpdatedAt, ...data } = input;
    return this.prisma.client.$transaction(async tx => {
      if (!await tx.legalEntity.findFirst({ where: { id, firmId, active: true }, select: { id: true } })) throw new NotFoundException('Active legal entity not found');
      const result = await tx.legalEntity.updateMany({ where: { id, firmId, active: true, updatedAt: new Date(expectedUpdatedAt) }, data: { ...data, updatedAt: this.nextTimestamp(expectedUpdatedAt) } });
      if (!result.count) throw this.conflict();
      await this.audit.record({ firmId, actorUserId: actorId, action: 'legal_entity.profile_updated', entityType: 'legal_entity', entityId: id,
        metadata: { changedKeys: Object.keys(data), previousUpdatedAt: expectedUpdatedAt } }, tx);
      return tx.legalEntity.findUniqueOrThrow({ where: { id } });
    });
  }

  async updateBranchContact(firmId: string, actorId: string, id: string, input: BranchContactWrite) {
    const { expectedUpdatedAt, ...data } = input;
    return this.prisma.client.$transaction(async tx => {
      if (!await tx.branch.findFirst({ where: { id, firmId, active: true }, select: { id: true } })) throw new NotFoundException('Active branch not found');
      const result = await tx.branch.updateMany({ where: { id, firmId, active: true, updatedAt: new Date(expectedUpdatedAt) }, data: { ...data, updatedAt: this.nextTimestamp(expectedUpdatedAt) } });
      if (!result.count) throw this.conflict();
      await this.audit.record({ firmId, actorUserId: actorId, action: 'branch.contact_updated', entityType: 'branch', entityId: id,
        metadata: { changedKeys: Object.keys(data), previousUpdatedAt: expectedUpdatedAt } }, tx);
      return tx.branch.findUniqueOrThrow({ where: { id } });
    });
  }

  getFirm(firmId: string) {
    return this.prisma.client.firm.findUnique({
      where: { id: firmId },
      include: {
        legalEntities: true,
        branches: { orderBy: { code: "asc" } },
        departments: { orderBy: { name: "asc" } },
        teams: { orderBy: { name: "asc" } }
      }
    });
  }

  listBranches(firmId: string) {
    return this.prisma.client.branch.findMany({
      where: { firmId },
      orderBy: [{ active: "desc" }, { name: "asc" }]
    });
  }

  async createBranch(firmId: string, actorId: string, data: {
    name: string; code: string; address?: string; postalAddress?: string; phone?: string; email?: string;
    defaultCourtStation?: string; numberingPrefix?: string;
  }) {
    const branch = await this.prisma.client.branch.create({
      data: {
        firmId,
        name: data.name,
        code: data.code.toUpperCase(),
        address: data.address,
        postalAddress: data.postalAddress,
        phone: data.phone,
        email: data.email,
        defaultCourtStation: data.defaultCourtStation,
        numberingPrefix: data.numberingPrefix
      }
    });
    await this.audit.record({
      firmId,
      actorUserId: actorId,
      action: "branch.created",
      entityType: "branch",
      entityId: branch.id,
      metadata: { code: branch.code, name: branch.name }
    });
    return branch;
  }

  async updateBranch(firmId: string, actorId: string, branchId: string, data: Record<string, unknown>) {
    const existing = await this.prisma.client.branch.findFirst({ where: { id: branchId, firmId } });
    if (!existing) throw new NotFoundException("Branch not found");
    const allowed = {
      name: typeof data.name === "string" ? data.name : undefined,
      code: typeof data.code === "string" ? data.code.toUpperCase() : undefined,
      address: typeof data.address === "string" ? data.address : undefined,
      postalAddress: typeof data.postalAddress === "string" ? data.postalAddress : undefined,
      phone: typeof data.phone === "string" ? data.phone : undefined,
      email: typeof data.email === "string" ? data.email : undefined,
      defaultCourtStation: typeof data.defaultCourtStation === "string" ? data.defaultCourtStation : undefined,
      numberingPrefix: typeof data.numberingPrefix === "string" ? data.numberingPrefix : undefined,
      active: typeof data.active === "boolean" ? data.active : undefined
    };
    const branch = await this.prisma.client.branch.update({
      where: { id: branchId },
      data: allowed
    });
    await this.audit.record({
      firmId,
      actorUserId: actorId,
      action: "branch.updated",
      entityType: "branch",
      entityId: branchId,
      metadata: { changedKeys: Object.keys(data) }
    });
    return branch;
  }

  listRoles(firmId: string) {
    return this.prisma.client.role.findMany({
      where: { firmId },
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } }
      },
      orderBy: { name: "asc" }
    });
  }

  listPermissions() {
    return this.prisma.client.permission.findMany({ orderBy: [{ category: "asc" }, { key: "asc" }] });
  }

  async replaceRolePermissions(firmId: string, actorId: string, roleId: string, permissionKeys: string[]) {
    const role = await this.prisma.client.role.findFirst({ where: { id: roleId, firmId } });
    if (!role) throw new NotFoundException("Role not found");
    const permissions = await this.prisma.client.permission.findMany({ where: { key: { in: permissionKeys } } });
    await this.prisma.client.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { roleId } });
      await tx.rolePermission.createMany({
        data: permissions.map((p) => ({ roleId, permissionId: p.id }))
      });
    });
    await this.audit.record({
      firmId,
      actorUserId: actorId,
      action: "role.permissions_replaced",
      entityType: "role",
      entityId: roleId,
      metadata: { permissionKeys }
    });
    return this.listRoles(firmId);
  }
}
