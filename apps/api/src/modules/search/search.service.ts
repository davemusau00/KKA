import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../platform/prisma/prisma.service";

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(firmId: string, q: string) {
    const term = q.trim();
    if (term.length < 2) return { matters: [], clients: [], documents: [], tasks: [], proceedings: [], directory: [] };
    const [matters, clients, documents, tasks, proceedings, directory] = await Promise.all([
      this.prisma.client.matter.findMany({
        where: { firmId, OR: [
          { internalReference: { contains: term, mode: "insensitive" } },
          { title: { contains: term, mode: "insensitive" } },
          { summary: { contains: term, mode: "insensitive" } }
        ] },
        select: { id: true, internalReference: true, title: true, status: true, currentStageId: true },
        take: 20
      }),
      this.prisma.client.client.findMany({
        where: { firmId, OR: [
          { displayName: { contains: term, mode: "insensitive" } },
          { clientNumber: { contains: term, mode: "insensitive" } },
          { phone: { contains: term } },
          { idNumber: { contains: term, mode: "insensitive" } }
        ] },
        select: { id: true, clientNumber: true, displayName: true, phone: true, status: true },
        take: 20
      }),
      this.prisma.client.document.findMany({
        where: { matter: { firmId }, OR: [
          { title: { contains: term, mode: "insensitive" } },
          { documentType: { contains: term, mode: "insensitive" } }
        ] },
        select: { id: true, matterId: true, title: true, documentType: true, category: true, updatedAt: true },
        take: 20
      }),
      this.prisma.client.task.findMany({
        where: { matter: { firmId }, OR: [
          { title: { contains: term, mode: "insensitive" } },
          { description: { contains: term, mode: "insensitive" } }
        ] },
        select: { id: true, matterId: true, title: true, status: true, dueAt: true },
        take: 20
      }),
      this.prisma.client.courtProceeding.findMany({
        where: { matter: { firmId }, OR: [
          { caseNumber: { contains: term, mode: "insensitive" } },
          { courtName: { contains: term, mode: "insensitive" } }
        ] },
        select: { id: true, matterId: true, caseNumber: true, courtName: true, status: true },
        take: 20
      }),
      this.prisma.client.directoryContact.findMany({
        where: { firmId, OR: [
          { displayName: { contains: term, mode: "insensitive" } },
          { organizationName: { contains: term, mode: "insensitive" } },
          { phone: { contains: term } }
        ] },
        select: { id: true, type: true, displayName: true, organizationName: true, phone: true },
        take: 20
      })
    ]);
    return { matters, clients, documents, tasks, proceedings, directory };
  }
}
