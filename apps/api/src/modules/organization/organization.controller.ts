import { Body, Controller, Get, Param, Patch, Post, Put } from "@nestjs/common";
import { CreateBranchSchema } from "@kka/contracts";
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

  @Get("branches")
  listBranches(@CurrentUser() user: RequestUser) {
    return this.org.listBranches(user.firmId);
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
