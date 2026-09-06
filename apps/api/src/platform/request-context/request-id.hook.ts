import type { FastifyRequest } from "fastify";
import { randomUUID } from "node:crypto";

export function assignRequestId(request: { headers: FastifyRequest['headers']; requestId?: string }): void {
  const existing = request.headers["x-request-id"];
  const requestId = typeof existing === "string" && existing.length > 0 ? existing : randomUUID();
  request.requestId = requestId;
}
