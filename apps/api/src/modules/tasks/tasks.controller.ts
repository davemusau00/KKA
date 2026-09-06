import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { CreateTaskSchema, UpdateTaskStatusSchema } from "@kka/contracts";
import { CurrentUser, RequirePermissions } from "../../platform/auth/decorators";
import type { RequestUser } from "../../platform/auth/auth.types";
import { TasksService } from "./tasks.service";

@Controller("tasks")
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  @RequirePermissions("task.view")
  list(
    @CurrentUser() user: RequestUser,
    @Query("matterId") matterId?: string,
    @Query("assignedToId") assignedToId?: string,
    @Query("status") status?: string
  ) {
    return this.tasks.list(user.firmId, { matterId, assignedToId, status });
  }

  @Post()
  @RequirePermissions("task.create")
  create(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    return this.tasks.create(user.firmId, user.id, CreateTaskSchema.parse(body));
  }

  @Post(":id/status")
  @RequirePermissions("task.edit")
  status(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    return this.tasks.setStatus(user.firmId, user.id, id, UpdateTaskStatusSchema.parse(body));
  }
}
