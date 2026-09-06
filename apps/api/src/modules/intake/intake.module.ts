import { Module } from "@nestjs/common";
import { ClientsModule } from "../clients/clients.module";
import { MattersModule } from "../matters/matters.module";
import { IntakeController } from "./intake.controller";
import { IntakeService } from "./intake.service";

@Module({
  imports: [ClientsModule, MattersModule],
  controllers: [IntakeController],
  providers: [IntakeService],
  exports: [IntakeService]
})
export class IntakeModule {}
