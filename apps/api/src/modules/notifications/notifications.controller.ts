import { Controller, Get, Param, Post, Query } from "@nestjs/common";
import { CurrentUser } from "../../platform/auth/decorators";
import type { RequestUser } from "../../platform/auth/auth.types";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: RequestUser, @Query("unread") unread?: string) {
    return this.notifications.list(user.id, unread === "true");
  }

  @Post(":id/read")
  read(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.notifications.markRead(user.id, id);
  }
}
