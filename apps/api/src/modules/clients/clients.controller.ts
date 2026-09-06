import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { CreateClientSchema } from "@kka/contracts";
import { CurrentUser, RequirePermissions } from "../../platform/auth/decorators";
import type { RequestUser } from "../../platform/auth/auth.types";
import { ClientsService } from "./clients.service";

@Controller("clients")
export class ClientsController {
  constructor(private readonly clients: ClientsService) {}

  @Get()
  @RequirePermissions("module.clients")
  list(@CurrentUser() user: RequestUser, @Query("q") q?: string) {
    return this.clients.list(user.firmId, q);
  }

  @Get(":id")
  @RequirePermissions("module.clients")
  get(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.clients.get(user.firmId, id);
  }

  @Post()
  @RequirePermissions("matter.create")
  create(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    return this.clients.create(user.firmId, user.id, CreateClientSchema.parse(body));
  }

  @Patch(":id")
  @RequirePermissions("matter.update")
  update(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    return this.clients.update(user.firmId, user.id, id, CreateClientSchema.partial().parse(body));
  }
}
