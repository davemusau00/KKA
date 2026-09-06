import { Module } from "@nestjs/common";
import { TasksModule } from "../tasks/tasks.module";
import { OperationsController } from "./operations.controller";
import { OperationsService } from "./operations.service";
@Module({
  imports: [TasksModule],
  controllers: [OperationsController],
  providers: [OperationsService],
  exports: [OperationsService]
})
export class OperationsModule {}
