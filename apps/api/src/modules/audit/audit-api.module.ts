import { Module } from "@nestjs/common";
import { AuditController } from "./audit.controller";
import { RecordAccessModule } from "../../platform/auth/record-access.module";
@Module({ imports: [RecordAccessModule], controllers: [AuditController] })
export class AuditApiModule {}
