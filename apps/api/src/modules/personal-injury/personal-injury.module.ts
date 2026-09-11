import { Module } from "@nestjs/common";
import { PrismaModule } from "../../platform/prisma/prisma.module";
import { AuditModule } from "../../platform/audit/audit.module";
import { RecordAccessModule } from "../../platform/auth/record-access.module";
import { PersonalInjuryController } from "./personal-injury.controller";
import { PersonalInjuryService } from "./personal-injury.service";
@Module({ imports:[PrismaModule,AuditModule,RecordAccessModule], controllers:[PersonalInjuryController], providers:[PersonalInjuryService], exports:[PersonalInjuryService] })
export class PersonalInjuryModule {}
