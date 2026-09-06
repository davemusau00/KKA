import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { InviteUserSchema } from "@kka/contracts";
import { CurrentUser, RequirePermissions } from "../../platform/auth/decorators";
import type { RequestUser } from "../../platform/auth/auth.types";
import { UsersService } from "./users.service";
import { z } from "zod";

@Controller("users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @RequirePermissions("admin.users_manage")
  list(@CurrentUser() user: RequestUser) {
    return this.users.list(user.firmId);
  }

  @Post("invite")
  @RequirePermissions("admin.users_manage")
  invite(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    return this.users.invite(user.firmId, user.id, InviteUserSchema.parse(body));
  }

  @Patch(":id/status")
  @RequirePermissions("admin.users_manage")
  setStatus(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    const input = z.object({ status: z.enum(["ACTIVE", "SUSPENDED", "DISABLED"]) }).parse(body);
    return this.users.setStatus(user.firmId, user.id, id, input.status);
  }

  @Patch(":id/roles")
  @RequirePermissions("admin.roles_manage")
  roles(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    const input = z.object({ roleKeys: z.array(z.string()).min(1) }).parse(body);
    return this.users.replaceRoles(user.firmId, user.id, id, input.roleKeys);
  }
}
