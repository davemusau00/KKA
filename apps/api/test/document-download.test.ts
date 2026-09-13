import "reflect-metadata";
import assert from "node:assert/strict";
import test from "node:test";
import { ForbiddenException } from "@nestjs/common";
import { DocumentsController } from "../src/modules/documents/documents.controller";
import { DocumentsService } from "../src/modules/documents/documents.service";

const version = {
  id: "version-1",
  documentId: "document-1",
  storagePath: "firm-1/document-1/version-1.pdf",
  mimeType: "application/pdf",
  originalFilename: "evidence.pdf",
  document: { matterId: "matter-1" }
};

test("document download authorizes the document before storage is opened", async () => {
  const events: string[] = [];
  const documents = {
    getVersionForDownload: async () => { events.push("lookup"); return version; },
    openAuthorizedVersionForDownload: async () => { events.push("open"); return "stream"; }
  };
  const access = { document: async () => { events.push("access"); } };
  const reply = {
    header: () => reply,
    send: (stream: unknown) => { events.push(`send:${String(stream)}`); return stream; }
  };

  await new DocumentsController(documents as never, access as never).download(
    { id: "user-1", firmId: "firm-1" } as never,
    version.id,
    reply as never
  );
  assert.deepEqual(events, ["lookup", "access", "open", "send:stream"]);
});

test("a denied document download never opens the storage object", async () => {
  let opened = false;
  const documents = {
    getVersionForDownload: async () => version,
    openAuthorizedVersionForDownload: async () => { opened = true; return "stream"; }
  };
  const access = { document: async () => { throw new ForbiddenException("Matter access is required"); } };

  await assert.rejects(
    () => new DocumentsController(documents as never, access as never).download({ id: "user-1", firmId: "firm-1" } as never, version.id, {} as never),
    ForbiddenException
  );
  assert.equal(opened, false);
});

test("authorized storage opening records a document download audit event", async () => {
  const audits: unknown[] = [];
  const service = new DocumentsService(
    {} as never,
    { openDocument: async () => "stream" } as never,
    { record: async (event: unknown) => { audits.push(event); } } as never,
    {} as never
  );

  const stream = await service.openAuthorizedVersionForDownload("firm-1", "user-1", version);
  assert.equal(stream, "stream");
  assert.deepEqual(audits, [{
    firmId: "firm-1",
    actorUserId: "user-1",
    action: "document.downloaded",
    entityType: "document_version",
    entityId: "version-1",
    matterId: "matter-1",
    metadata: { documentId: "document-1" }
  }]);
});
