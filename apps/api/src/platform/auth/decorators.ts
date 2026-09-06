import { createParamDecorator, ExecutionContext, SetMetadata } from "@nestjs/common";
import type { RequestUser } from "./auth.types";

export const PUBLIC_ROUTE = "kka:public";
export const REQUIRED_PERMISSIONS = "kka:permissions";

export const Public = () => SetMetadata(PUBLIC_ROUTE, true);
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(REQUIRED_PERMISSIONS, permissions);

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): RequestUser => {
    const req = context.switchToHttp().getRequest<{ authUser?: RequestUser }>();
    if (!req.authUser) throw new Error("CurrentUser used without authenticated request");
    return req.authUser;
  }
);
