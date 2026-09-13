import { Module } from "@nestjs/common";
import { TasksModule } from "../tasks/tasks.module";
import { RecordAccessModule } from "../../platform/auth/record-access.module";
import { FinanceModule } from "../finance/finance.module";
import { ApprovalsModule } from "../approvals/approvals.module";
import { OperationsController } from "./operations.controller";
import { OperationsService } from "./operations.service";
@Module({
  imports: [TasksModule, RecordAccessModule, FinanceModule, ApprovalsModule],
  controllers: [OperationsController],
  providers: [OperationsService],
  exports: [OperationsService]
})
export class OperationsModule {}
