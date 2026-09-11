import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';
import type { RequestUser } from '../../platform/auth/auth.types';
import { RecordAccessService } from '../../platform/auth/record-access.service';
@Injectable()
export class DocumentAccessService {
  constructor(private readonly prisma: PrismaService, private readonly access: RecordAccessService) {}
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
    const matter = await this.prisma.client.matter.findFirst({ where: { id, ...(await this.access.matterWhere(user)) } });
    if (!matter) throw new NotFoundException('Matter not found');
    return matter;
  }
}
