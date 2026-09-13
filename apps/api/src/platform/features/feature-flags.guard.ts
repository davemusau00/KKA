import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { FEATURE_FLAG_KEY } from "./feature-flags.decorator";
import { FeatureFlagsService } from "./feature-flags.service";

@Injectable()
export class FeatureFlagsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly flags: FeatureFlagsService) {}

  async canActivate(context: ExecutionContext) {
    const key = this.reflector.getAllAndOverride<string>(FEATURE_FLAG_KEY, [context.getHandler(), context.getClass()]);
    if (key) await this.flags.assertEnabled(key);
    return true;
  }
}
