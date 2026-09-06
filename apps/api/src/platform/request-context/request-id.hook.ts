import type { FastifyRequest } from "fastify";
import { randomUUID } from "node:crypto";

export function assignRequestId(request: FastifyRequest): void {
  const existing = request.headers["x-request-id"];
  const requestId = typeof existing === "string" && existing.length > 0 ? existing : randomUUID();
  (request as FastifyRequest & { requestId?: string }).requestId = requestId;
}
