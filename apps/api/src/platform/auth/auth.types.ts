import type { FastifyRequest } from "fastify";

export interface RequestUser {
  id: string;
  firmId: string;
  email: string;
  fullName: string;
  homeBranchId?: string | null;
  roleKeys: string[];
  permissions: string[];
}

export type AuthenticatedRequest = FastifyRequest & {
  authUser?: RequestUser;
  requestId?: string;
};
