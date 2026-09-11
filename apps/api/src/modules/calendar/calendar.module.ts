import { Module } from "@nestjs/common";
import { CalendarController } from "./calendar.controller";
import { CalendarService } from "./calendar.service";
import { RecordAccessModule } from "../../platform/auth/record-access.module";

@Module({ imports: [RecordAccessModule], controllers: [CalendarController], providers: [CalendarService], exports: [CalendarService] })
export class CalendarModule {}
