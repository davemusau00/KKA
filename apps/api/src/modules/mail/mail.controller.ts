import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { z } from "zod";
import { CurrentUser } from "../../platform/auth/decorators";
import type { RequestUser } from "../../platform/auth/auth.types";
import { MailService } from "./mail.service";

@Controller("mail")
export class MailController {
  constructor(private readonly mail: MailService) {}

  @Get("sender-identities")
  senders(@CurrentUser() user: RequestUser) {
    return this.mail.senderIdentities(user.firmId);
  }

  @Post("send")
  send(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    const input = z.object({
      senderIdentityId: z.string(),
      to: z.array(z.string().email()).min(1),
      cc: z.array(z.string().email()).optional(),
      bcc: z.array(z.string().email()).optional(),
      subject: z.string().min(1).max(500),
      bodyText: z.string().optional(),
      bodyHtml: z.string().optional(),
      matterId: z.string().optional(),
      clientId: z.string().optional(),
      intakeId: z.string().optional()
    }).parse(body);
    return this.mail.send(user.firmId, user.id, input);
  }

  @Get("triage")
  triage(@CurrentUser() user: RequestUser, @Query("status") status?: string) {
    return this.mail.triage(user.firmId, status);
  }

  @Post(":id/link-matter")
  link(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    const input = z.object({ matterId: z.string() }).parse(body);
    return this.mail.linkToMatter(user.firmId, user.id, id, input.matterId);
  }
}
