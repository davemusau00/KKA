import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { z } from "zod";
import { CurrentUser } from "../../platform/auth/decorators";
import type { RequestUser } from "../../platform/auth/auth.types";
import { DirectoryService } from "./directory.service";

const ContactSchema = z.object({
  type: z.string().min(2).max(100),
  displayName: z.string().min(2).max(250),
  organizationName: z.string().max(250).optional(),
  phone: z.string().max(50).optional(),
  alternatePhone: z.string().max(50).optional(),
  email: z.string().email().optional(),
  address: z.string().max(500).optional(),
  county: z.string().max(100).optional(),
  specialization: z.string().max(250).optional(),
  identifiers: z.record(z.string(), z.unknown()).optional(),
  notes: z.string().max(5000).optional(),
  active: z.boolean().default(true)
});

@Controller("directory")
export class DirectoryController {
  constructor(private readonly directory: DirectoryService) {}

  @Get()
  list(@CurrentUser() user: RequestUser, @Query("type") type?: string, @Query("q") q?: string) {
    return this.directory.list(user.firmId, type, q);
  }

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    return this.directory.create(user.firmId, user.id, ContactSchema.parse(body));
  }

  @Patch(":id")
  update(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    return this.directory.update(user.firmId, user.id, id, ContactSchema.partial().parse(body));
  }
}
