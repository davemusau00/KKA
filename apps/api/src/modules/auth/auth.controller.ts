import { Body, Controller, Get, Post, Req, Res } from "@nestjs/common";
import { z } from "zod";
import type { FastifyReply } from "fastify";
import { LoginSchema, AcceptInviteSchema } from "@kka/contracts";
import { AuthService } from "./auth.service";
import { CurrentUser, Public } from "../../platform/auth/decorators";
import type { AuthenticatedRequest, RequestUser } from "../../platform/auth/auth.types";
import { env } from "../../platform/env";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post("login")
  async login(@Body() body: unknown, @Res({ passthrough: true }) reply: FastifyReply) {
    const input = LoginSchema.parse(body);
    const result = await this.auth.login(input);
    reply.setCookie(env().SESSION_COOKIE_NAME, result.sid, {
      httpOnly: true,
      secure: env().SESSION_COOKIE_SECURE,
      sameSite: env().SESSION_COOKIE_SAME_SITE,
      domain: env().SESSION_COOKIE_DOMAIN || undefined,
      path: "/",
      maxAge: env().SESSION_TTL_SECONDS
    });
    return { user: result.user };
  }

  @Public()
  @Post("accept-invite")
  async acceptInvite(@Body() body: unknown) {
    const input = AcceptInviteSchema.parse(body);
    return this.auth.acceptInvite(input.token, input.password);
  }

  @Post("elevate")
  async elevate(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    const input = z.object({ password: z.string().min(1) }).parse(body);
    return this.auth.elevate(user.id, input.password);
  }

  @Post("logout")
  async logout(@Req() request: AuthenticatedRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    const sid = request.cookies?.[env().SESSION_COOKIE_NAME];
    await this.auth.logout(sid);
    reply.clearCookie(env().SESSION_COOKIE_NAME, { path: "/" });
    return { ok: true };
  }

  @Get("me")
  me(@CurrentUser() user: RequestUser) {
    return user;
  }

  @Post('elevate')
  elevate(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    return this.auth.elevate(user.id, z.object({ password: z.string().min(1) }).parse(body).password);
  }
}
