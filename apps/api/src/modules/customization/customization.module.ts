import { Module } from "@nestjs/common";
import { PrismaModule } from "../../platform/prisma/prisma.module";import { AuditModule } from "../../platform/audit/audit.module";import { StorageModule } from "../../platform/storage/storage.module";
import { CustomizationController } from "./customization.controller";import { CustomizationService } from "./customization.service";
@Module({imports:[PrismaModule,AuditModule,StorageModule],controllers:[CustomizationController],providers:[CustomizationService]}) export class CustomizationModule{}
