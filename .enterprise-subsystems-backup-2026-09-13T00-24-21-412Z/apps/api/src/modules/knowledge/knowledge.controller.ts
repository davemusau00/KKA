import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { CreateKnowledgeItemSchema } from "@kka/contracts";
import { CurrentUser } from "../../platform/auth/decorators";
import type { RequestUser } from "../../platform/auth/auth.types";
import { KnowledgeService } from "./knowledge.service";
@Controller("knowledge")
export class KnowledgeController {
  constructor(private readonly knowledge: KnowledgeService) {}
  @Get()
  list(@CurrentUser() user: RequestUser, @Query("q") q?: string, @Query("practiceArea") practiceArea?: string) {
    return this.knowledge.list(user.firmId, q, practiceArea);
  }
  @Post()
  create(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    return this.knowledge.create(user.firmId, user.id, CreateKnowledgeItemSchema.parse(body));
  }
}
