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
    return this.comms.listChannels(user);
  }

  @Post("channels/matter/:matterId")
  @RequirePermissions("module.comms")
  matterChannel(@CurrentUser() user: RequestUser, @Param("matterId") matterId: string, @Body() body: unknown) {
    const input = z.object({ name: z.string().min(2).max(250).optional(), description: z.string().max(2000).optional(), private: z.boolean().optional(), memberIds: z.array(z.string()).max(100).optional() }).parse(body);
    return this.comms.getOrCreateMatterChannel(user, matterId, input);
  }

  @Post("channels/direct")
  @RequirePermissions("module.comms")
  directChannel(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    const input = z.object({ userId: z.string(), matterId: z.string().optional() }).parse(body);
    return this.comms.getOrCreateDirectChannel(user, input.userId, input.matterId);
  }

  @Get("channels/:id/messages")
  @RequirePermissions("module.comms")
  messages(@CurrentUser() user: RequestUser, @Param("id") id: string, @Query("before") before?: string) {
    return this.comms.messages(user, id, before ? new Date(before) : undefined);
  }

  @Post("channels/:id/messages")
  @RequirePermissions("module.comms")
  send(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    const input = z.object({ text: z.string().min(1).max(20000), replyToId: z.string().optional(), mentionUserIds: z.array(z.string()).max(50).optional(), attachmentDocumentIds: z.array(z.string()).max(10).optional() }).parse(body);
    return this.comms.send(user, id, input);
  }

  @Post("channels/:id/read")
  @RequirePermissions("module.comms")
  read(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    const input = z.object({ lastReadMessageId: z.string().optional() }).parse(body);
    return this.comms.markRead(user, id, input.lastReadMessageId);
  }

  @Post("messages/:id/convert-task")
  @RequirePermissions("module.comms", "task.create")
  convertTask(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    const input = z.object({ title: z.string().min(2).max(300), assignedToId: z.string(), dueAt: z.string().datetime(), priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM") }).parse(body);
    return this.comms.convertMessageToTask(user, id, input);
  }
}
