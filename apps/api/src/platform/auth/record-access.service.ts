import { Injectable } from "@nestjs/common";
import type { Prisma } from "@kka/database";
import { PrismaService } from "../prisma/prisma.service";
import type { RequestUser } from "./auth.types";

/**
 * Shared matter visibility policy. A matter with no MatterAccess rows remains
 * firm-visible; once access rows exist, visibility is restricted to the named
 * user/team or an access administrator. All callers must apply this predicate
 * before returning records to the client.
 */
@Injectable()
export class RecordAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async matterWhere(user: RequestUser): Promise<Prisma.MatterWhereInput> {
    if (user.permissions.includes("matter.access_manage")) return { firmId: user.firmId };

    const memberships = await this.prisma.client.userTeam.findMany({
      where: { userId: user.id },
      select: { teamId: true }
    });
    const teamIds = memberships.map(({ teamId }) => teamId);

    return {
      firmId: user.firmId,
      OR: [
        { accesses: { none: {} } },
        { accesses: { some: { userId: user.id } } },
        ...(teamIds.length ? [{ accesses: { some: { teamId: { in: teamIds } } } }] : [])
      ]
    };
  }

  async canViewMatter(user: RequestUser, matterId: string): Promise<boolean> {
    const matter = await this.prisma.client.matter.findFirst({
      where: { id: matterId, ...(await this.matterWhere(user)) },
      select: { id: true }
    });
    return Boolean(matter);
  }
}
