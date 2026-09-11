import { Global, Module } from "@nestjs/common";
import { RecordAccessService } from "./record-access.service";

@Global()
@Module({
  providers: [RecordAccessService],
  exports: [RecordAccessService]
})
export class RecordAccessModule {}
