import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { z } from "zod";
import { CurrentUser, RequirePermissions } from "../../platform/auth/decorators";
import type { RequestUser } from "../../platform/auth/auth.types";
import { CommunicationsService } from "./communications.service";

@Controller("communications")
export class CommunicationsController {
  constructor(private readonly comms: CommunicationsService) {}

  @Get("channels")
  @RequirePermissions("module.comms")
  channels(@CurrentUser() user: RequestUser) {
    return this.comms.listChannels(user.firmId, user.id);
  }

  @Get("channels/:id/messages")
  @RequirePermissions("module.comms")
  messages(@CurrentUser() user: RequestUser, @Param("id") id: string, @Query("before") before?: string) {
    return this.comms.messages(user.firmId, user.id, id, before ? new Date(before) : undefined);
  }

  @Post("channels/:id/messages")
  @RequirePermissions("module.comms")
  send(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    const input = z.object({ text: z.string().min(1).max(20000), replyToId: z.string().optional() }).parse(body);
    return this.comms.send(user.firmId, user.id, id, input.text, input.replyToId);
  }
}
