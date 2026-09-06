import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../platform/prisma/prisma.service";
import { AuditService } from "../../platform/audit/audit.service";

@Injectable()
export class OrganizationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

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
