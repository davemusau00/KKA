import { Module } from "@nestjs/common";
import { FinanceController } from "./finance.controller";
import { FinanceService } from "./finance.service";
import { PrismaModule } from "../../platform/prisma/prisma.module";
import { AuditModule } from "../../platform/audit/audit.module";
import { RecordAccessModule } from "../../platform/auth/record-access.module";

@Module({ imports: [PrismaModule, AuditModule, RecordAccessModule], controllers: [FinanceController], providers: [FinanceService], exports: [FinanceService] })
export class FinanceModule {}
