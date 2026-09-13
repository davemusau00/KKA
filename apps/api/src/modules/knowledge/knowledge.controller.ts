import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { CreateKnowledgeItemSchema } from "@kka/contracts";
import { z } from "zod";
import { CurrentUser, RequirePermissions } from "../../platform/auth/decorators";
import type { RequestUser } from "../../platform/auth/auth.types";
import { KnowledgeService } from "./knowledge.service";

const UpdateKnowledgeItemSchema = z.object({
  type: z.string().min(2).max(100).optional(),
  title: z.string().min(2).max(300).optional(),
  summary: z.string().max(5000).nullable().optional(),
  practiceArea: z.string().max(120).nullable().optional(),
  tags: z.array(z.string()).optional(),
  documentId: z.string().nullable().optional()
});

@Controller("knowledge")
export class KnowledgeController {
  constructor(private readonly knowledge: KnowledgeService) {}

  @Get()
  @RequirePermissions("module.knowledge")
  list(
    @CurrentUser() user: RequestUser,
    @Query("q") q?: string,
    @Query("practiceArea") practiceArea?: string,
    @Query("status") status?: string
  ) {
    return this.knowledge.list(user.firmId, { q, practiceArea, status });
  }

  @Get(":id")
  @RequirePermissions("module.knowledge")
  get(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.knowledge.get(user.firmId, id);
  }

  @Post()
  @RequirePermissions("knowledge.manage")
  create(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    return this.knowledge.create(user.firmId, user.id, CreateKnowledgeItemSchema.parse(body));
  }

  @Patch(":id")
  @RequirePermissions("knowledge.manage")
  update(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    return this.knowledge.update(user.firmId, user.id, id, UpdateKnowledgeItemSchema.parse(body));
  }

  @Post(":id/status")
  @RequirePermissions("knowledge.manage")
  status(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    const input = z.object({
      status: z.enum(["DRAFT", "IN_REVIEW", "PUBLISHED", "ARCHIVED"])
    }).parse(body);
    return this.knowledge.setStatus(user.firmId, user.id, id, input.status);
  }
}
