import { Body, Controller, Get, Param, Patch, Post, Put } from "@nestjs/common";
import { CreateBranchSchema, FirmIdentityWriteSchema, LegalEntityWriteSchema, BranchContactWriteSchema } from "@kka/contracts";
import { z } from "zod";
import { CurrentUser, RequirePermissions } from "../../platform/auth/decorators";
import type { RequestUser } from "../../platform/auth/auth.types";
import { OrganizationService } from "./organization.service";

@Controller("organization")
export class OrganizationController {
  constructor(private readonly org: OrganizationService) {}

  @Get()
  getFirm(@CurrentUser() user: RequestUser) {
    return this.org.getFirm(user.firmId);
  }

  @Get("profile")
  @RequirePermissions("admin.settings_manage")
  profile(@CurrentUser() user: RequestUser) {
    return this.org.profile(user.firmId);
  }

  @Patch("profile")
  @RequirePermissions("admin.settings_manage")
  identity(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    return this.org.updateIdentity(user.firmId, user.id, FirmIdentityWriteSchema.parse(body));
  }

  @Patch("legal-entities/:id")
  @RequirePermissions("admin.settings_manage")
  legalEntity(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    return this.org.updateLegalEntity(user.firmId, user.id, id, LegalEntityWriteSchema.parse(body));
  }

  @Patch("branches/:id/contact")
  @RequirePermissions("admin.branches_manage")
  branchContact(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    return this.org.updateBranchContact(user.firmId, user.id, id, BranchContactWriteSchema.parse(body));
  }

  @Get("branches")
  listBranches(@CurrentUser() user: RequestUser) {
    return this.org.listBranches(user.firmId);
  }

  @Get("departments")
  @RequirePermissions("hr.manage")
  departments(@CurrentUser() user: RequestUser) { return this.org.listDepartments(user.firmId); }

  @Post("departments")
  @RequirePermissions("hr.manage")
  department(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    const input = z.object({ name: z.string().min(2).max(200), code: z.string().min(2).max(30), branchId: z.string().optional(), managerId: z.string().optional(), costCentre: z.string().max(100).optional() }).parse(body);
    return this.org.createDepartment(user.firmId, user.id, input);
  }

  @Patch("departments/:id")
  @RequirePermissions("hr.manage")
  updateDepartment(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    const input = z.object({ name: z.string().min(2).max(200).optional(), managerId: z.string().nullable().optional(), costCentre: z.string().max(100).nullable().optional(), active: z.boolean().optional() }).parse(body);
    return this.org.updateDepartment(user.firmId, user.id, id, input);
  }

  @Post("branches")
  @RequirePermissions("admin.branches_manage")
  createBranch(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    return this.org.createBranch(user.firmId, user.id, CreateBranchSchema.parse(body));
  }

  @Patch("branches/:id")
  @RequirePermissions("admin.branches_manage")
  updateBranch(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
    @Body() body: Record<string, unknown>
  ) {
    return this.org.updateBranch(user.firmId, user.id, id, body);
  }

  @Get("roles")
  @RequirePermissions("admin.roles_manage")
  roles(@CurrentUser() user: RequestUser) {
    return this.org.listRoles(user.firmId);
  }

  @Get("permissions")
  @RequirePermissions("admin.roles_manage")
  permissions() {
    return this.org.listPermissions();
  }

  @Put("roles/:id/permissions")
  @RequirePermissions("admin.roles_manage")
  replacePermissions(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
    @Body() body: unknown
  ) {
    const input = z.object({ permissionKeys: z.array(z.string()) }).parse(body);
    return this.org.replaceRolePermissions(user.firmId, user.id, id, input.permissionKeys);
  }
}
