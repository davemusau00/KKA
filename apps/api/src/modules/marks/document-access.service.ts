import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';
import type { RequestUser } from '../../platform/auth/auth.types';
@Injectable()
export class DocumentAccessService {
  constructor(private readonly prisma: PrismaService) {}
  async document(user: RequestUser, id: string) {
    const document = await this.prisma.client.document.findFirst({ where: { id, matter: { firmId: user.firmId } }, include: { matter: true } });
    if (!document) throw new NotFoundException('Document not found');
    await this.matter(user, document.matterId);
    const privileged = user.roleKeys.some(r => ['managing_partner', 'technical_admin'].includes(r));
    if (['PARTNER_ONLY','SEALED'].includes(document.confidentialityLevel) && !privileged) throw new ForbiddenException('Document confidentiality restriction');
    if (document.confidentialityLevel === 'RESTRICTED' && !privileged && document.ownerUserId !== user.id && !await this.prisma.client.matterAssignment.findFirst({ where: { matterId: document.matterId, userId: user.id, startsAt: { lte: new Date() }, OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }] } })) throw new ForbiddenException('Document assignment required');
    return document;
  }
  async matter(user: RequestUser, id: string) {
    const matter = await this.prisma.client.matter.findFirst({ where: { id, firmId: user.firmId } });
    if (!matter) throw new NotFoundException('Matter not found');
    if (!user.roleKeys.some(r => ['managing_partner','technical_admin'].includes(r))) {
      const branch = await this.prisma.client.userBranch.findFirst({ where: { userId: user.id, branchId: matter.responsibleBranchId } });
      if (!branch) throw new ForbiddenException('Matter branch access required');
    }
    return matter;
  }
}
