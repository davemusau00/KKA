import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { PrismaModule } from "./platform/prisma/prisma.module";
import { RedisModule } from "./platform/redis/redis.module";
import { CryptoModule } from "./platform/crypto/crypto.module";
import { AuditModule } from "./platform/audit/audit.module";
import { QueueModule } from "./platform/queue/queue.module";
import { StorageModule } from "./platform/storage/storage.module";
import { RealtimeModule } from "./platform/realtime/realtime.module";
import { SessionGuard } from "./platform/auth/session.guard";
import { PermissionsGuard } from "./platform/auth/permissions.guard";
import { RecordAccessModule } from "./platform/auth/record-access.module";
import { HealthModule } from "./modules/health/health.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { OrganizationModule } from "./modules/organization/organization.module";
import { SettingsModule } from "./modules/settings/settings.module";
import { NumberingModule } from "./modules/numbering/numbering.module";
import { ClientsModule } from "./modules/clients/clients.module";
import { IntakeModule } from "./modules/intake/intake.module";
import { MattersModule } from "./modules/matters/matters.module";
import { WorkflowsModule } from "./modules/workflows/workflows.module";
import { TasksModule } from "./modules/tasks/tasks.module";
import { DeadlinesModule } from "./modules/deadlines/deadlines.module";
import { CalendarModule } from "./modules/calendar/calendar.module";
import { DocumentsModule } from "./modules/documents/documents.module";
import { MarksModule } from "./modules/marks/marks.module";
import { FinanceModule } from "./modules/finance/finance.module";
import { ApprovalsModule } from "./modules/approvals/approvals.module";
import { CourtModule } from "./modules/court/court.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { CommunicationsModule } from "./modules/communications/communications.module";
import { IntegrationsModule } from "./modules/integrations/integrations.module";
import { DirectoryModule } from "./modules/directory/directory.module";
import { SearchModule } from "./modules/search/search.module";
import { ReportingModule } from "./modules/reporting/reporting.module";
import { OperationsModule } from "./modules/operations/operations.module";
import { KnowledgeModule } from "./modules/knowledge/knowledge.module";
import { MailModule } from "./modules/mail/mail.module";
import { AuditApiModule } from "./modules/audit/audit-api.module";
import { PersonalInjuryModule } from "./modules/personal-injury/personal-injury.module";
import { CustomizationModule } from "./modules/customization/customization.module";
import { AutomationModule } from "./modules/automation/automation.module";
import { DeveloperModule } from "./modules/developer/developer.module";
import { PortalModule } from "./modules/portal/portal.module";
import { WebsiteModule } from "./modules/website/website.module";

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    CryptoModule,
    AuditModule,
    QueueModule,
    StorageModule,
    RealtimeModule,
    RecordAccessModule,
    NumberingModule,
    HealthModule,
    AuthModule,
    UsersModule,
    OrganizationModule,
    SettingsModule,
    ClientsModule,
    IntakeModule,
    MattersModule,
    WorkflowsModule,
    TasksModule,
    DeadlinesModule,
    CalendarModule,
    DocumentsModule,
    MarksModule,
    FinanceModule,
    ApprovalsModule,
    CourtModule,
    NotificationsModule,
    CommunicationsModule,
    IntegrationsModule,
    DirectoryModule,
    SearchModule,
    ReportingModule,
    OperationsModule,
    KnowledgeModule,
    MailModule,
    AuditApiModule,
    PersonalInjuryModule,
    CustomizationModule,
    AutomationModule,
    DeveloperModule,
    PortalModule,
    WebsiteModule
  ],
  providers: [
    { provide: APP_GUARD, useClass: SessionGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard }
  ]
})
export class AppModule {}
