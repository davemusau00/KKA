const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../apps/api/src/modules/operations/operations.controller.ts');
let content = fs.readFileSync(filePath, 'utf8');

const seriesSchemas = `
const CreateMeetingSeriesSchema = z.object({
  title: z.string().min(2).max(300),
  description: z.string().max(5000).optional(),
  recurrenceRule: z.string().min(3).max(500),
  startsAt: z.string().datetime(),
  durationMinutes: z.coerce.number().int().positive().max(1440).optional(),
  location: z.string().max(500).optional(),
  projectId: z.string().optional(),
  matterId: z.string().optional(),
  agendaTemplate: z.unknown().optional(),
  defaultAttendeeIds: z.array(z.string()).optional(),
  rollingHorizonDays: z.coerce.number().int().min(7).max(365).optional()
});

const UpdateMeetingSeriesSchema = z.object({
  scope: z.enum(["this", "future", "all"]),
  meetingId: z.string().optional(),
  updates: z.object({
    title: z.string().min(2).max(300).optional(),
    description: z.string().max(5000).optional(),
    location: z.string().max(500).nullable().optional(),
    status: z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional()
  })
});
`;

const newRoutes = `
  @Get("projects/:id/financials")
  @RequirePermissions("module.operations")
  projectFinancials(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.ops.getProjectFinancials(user, id);
  }

  @Get("meeting-series")
  @RequirePermissions("module.operations")
  meetingSeries(
    @CurrentUser() user: RequestUser,
    @Query("projectId") projectId?: string,
    @Query("matterId") matterId?: string
  ) {
    return this.ops.listMeetingSeries(user.firmId, { projectId, matterId });
  }

  @Post("meeting-series")
  @RequirePermissions("operations.manage")
  createMeetingSeries(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    const input = CreateMeetingSeriesSchema.parse(body);
    return this.ops.createMeetingSeries(user.firmId, user.id, input);
  }

  @Get("meeting-series/:id")
  @RequirePermissions("module.operations")
  getMeetingSeries(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.ops.getMeetingSeries(user.firmId, id);
  }

  @Patch("meeting-series/:id")
  @RequirePermissions("operations.manage")
  updateMeetingSeries(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    const input = UpdateMeetingSeriesSchema.parse(body);
    return this.ops.updateMeetingSeries(user.firmId, user.id, id, input);
  }

  @Post("meeting-series/:id/advance")
  @RequirePermissions("operations.manage")
  advanceMeetingSeries(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.ops.advanceMeetingSeriesOccurrences(user.firmId, id);
  }
`;

// 1. Add schemas
if (!content.includes('CreateMeetingSeriesSchema')) {
  content = content.replace(
    'const MeetingUpdateSchema = z.object({',
    `${seriesSchemas.trim()}\r\n\r\nconst MeetingUpdateSchema = z.object({`
  );
}

// 2. Add endpoints after projectSpend
if (!content.includes('projectFinancials(')) {
  content = content.replace(
    /@Post\("projects\/:id\/spend"\)[\s\S]*?return this\.ops\.recordProjectSpend\(user\.firmId, user\.id, id, input\);\r?\n\s*\}/,
    (m) => `${m}\r\n${newRoutes}`
  );
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated operations.controller.ts');
