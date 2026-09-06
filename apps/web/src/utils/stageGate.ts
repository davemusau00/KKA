import { Matter, WorkflowStageConfig, Task, LegalDocument } from '../types';

export interface StageGateResult {
  canAdvance: boolean;
  blockingTasks: Task[];
  missingDocuments: string[];
  missingChecklistItems: string[];
  missingApprovals: string[];
  warnings: string[];
}

/**
 * Validates whether a matter is ready to advance from its current stage.
 * This is a pure function — no side effects, suitable for use in render.
 *
 * @param matter          The matter being evaluated
 * @param fromStageConfig The WorkflowStageConfig for the current (from) stage
 * @param allMatterTasks  All tasks associated with this matter (pre-filtered by matterId)
 * @param matterDocuments All documents associated with this matter (pre-filtered by matterId)
 * @param approvedTaskTitles Optional set of task titles that have been partner-approved
 */
export function validateStageTransition(
  matter: Matter,
  fromStageConfig: WorkflowStageConfig | undefined,
  allMatterTasks: Task[],
  matterDocuments: LegalDocument[],
  approvedTaskTitles?: Set<string>
): StageGateResult {
  const blockingTasks: Task[] = [];
  const missingDocuments: string[] = [];
  const missingChecklistItems: string[] = [];
  const missingApprovals: string[] = [];
  const warnings: string[] = [];

  const currentStageId = matter.currentStageId;

  // 1. Incomplete tasks for the current stage
  const stageTasks = allMatterTasks.filter(
    (t) => t.stageId === currentStageId
  );
  const incompleteTasks = stageTasks.filter(
    (t) => t.status !== 'completed' && t.status !== 'cancelled'
  );
  blockingTasks.push(...incompleteTasks);

  if (!fromStageConfig) {
    // No config found — permit with a warning (non-blocking)
    warnings.push(
      `No workflow configuration found for Stage ${currentStageId}. Proceeding without gate enforcement.`
    );
    return {
      canAdvance: true,
      blockingTasks: [],
      missingDocuments: [],
      missingChecklistItems: [],
      missingApprovals: [],
      warnings,
    };
  }

  // 2. Required document types
  if (fromStageConfig.requiredDocumentTypes && fromStageConfig.requiredDocumentTypes.length > 0) {
    const uploadedTypes = new Set(matterDocuments.map((d) => d.documentType));
    for (const requiredType of fromStageConfig.requiredDocumentTypes) {
      if (!uploadedTypes.has(requiredType)) {
        missingDocuments.push(requiredType);
      }
    }
  }

  // 3. Checklist items — treated as warnings until per-matter state is stored
  if (fromStageConfig.checklistItems && fromStageConfig.checklistItems.length > 0) {
    for (const item of fromStageConfig.checklistItems) {
      warnings.push(`Checklist item not confirmed: "${item}"`);
    }
  }

  // 4. Partner / approval role enforcement
  if (fromStageConfig.requiresApproval && fromStageConfig.approvalRole) {
    const approvalTask = stageTasks.find(
      (t) =>
        t.status === 'completed' &&
        (approvedTaskTitles
          ? approvedTaskTitles.has(t.title)
          : t.title.toLowerCase().includes('approv') ||
            t.title.toLowerCase().includes('authoris') ||
            t.title.toLowerCase().includes('sign'))
    );
    if (!approvalTask) {
      missingApprovals.push(
        `${fromStageConfig.approvalRole} approval required before advancing from Stage ${currentStageId}.`
      );
    }
  }

  // 5. Stale matter warning (no activity > 30 days)
  if (matter.lastActivityAt) {
    const daysSinceActivity =
      (Date.now() - new Date(matter.lastActivityAt).getTime()) / 86400000;
    if (daysSinceActivity > 30) {
      warnings.push(
        `Matter has had no activity for ${Math.round(daysSinceActivity)} days. Consider updating before advancing.`
      );
    }
  }

  const canAdvance =
    blockingTasks.length === 0 &&
    missingDocuments.length === 0 &&
    missingApprovals.length === 0;

  return {
    canAdvance,
    blockingTasks,
    missingDocuments,
    missingChecklistItems,
    missingApprovals,
    warnings,
  };
}
