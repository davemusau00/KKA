import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

/** Flags are enabled until an administrator explicitly disables them. */
@Injectable()
export class FeatureFlagsService {
  constructor(private readonly prisma: PrismaService) {}

  async isEnabled(key: string) {
    const flag = await this.prisma.client.featureFlag.findUnique({ where: { key }, select: { enabled: true } });
    return flag?.enabled ?? true;
  }

  async assertEnabled(key: string) {
    if (!(await this.isEnabled(key))) throw new ServiceUnavailableException(`The ${key} feature is currently unavailable`);
  }
}
