import { Task, TaskStatus } from '../types';

export interface TaskDependencyEvaluation {
  isBlocked: boolean;
  pendingDependencies: Task[];
  completedDependencies: Task[];
}

/**
 * Evaluates whether a task has unmet prerequisite dependencies.
 */
export function evaluateTaskDependencies(task: Task, allTasks: Task[]): TaskDependencyEvaluation {
  if (!task.dependsOnTaskIds || task.dependsOnTaskIds.length === 0) {
    return {
      isBlocked: false,
      pendingDependencies: [],
      completedDependencies: [],
    };
  }

  const pendingDependencies: Task[] = [];
  const completedDependencies: Task[] = [];

  for (const depId of task.dependsOnTaskIds) {
    const depTask = allTasks.find((t) => t.id === depId);
    if (!depTask) continue;

    if (depTask.status === 'completed') {
      completedDependencies.push(depTask);
    } else {
      pendingDependencies.push(depTask);
    }
  }

  return {
    isBlocked: pendingDependencies.length > 0,
    pendingDependencies,
    completedDependencies,
  };
}

/**
 * Validates if a task's status can be updated to the target status.
 * Prevents tasks from being marked as 'in_progress' or 'completed' if dependencies are not met.
 */
export function canUpdateTaskStatus(
  task: Task,
  newStatus: TaskStatus,
  allTasks: Task[]
): { allowed: boolean; reason?: string; blockingTasks: Task[] } {
  // If moving to in_progress or completed, dependencies MUST be met
  if (newStatus === 'in_progress' || newStatus === 'completed') {
    const evalResult = evaluateTaskDependencies(task, allTasks);
    if (evalResult.isBlocked) {
      const taskNames = evalResult.pendingDependencies.map((t) => `"${t.title}" (${t.status.replace('_', ' ')})`).join(', ');
      return {
        allowed: false,
        reason: `Cannot transition task to "${newStatus.replace('_', ' ')}": The following prerequisite task(s) must be completed first: ${taskNames}`,
        blockingTasks: evalResult.pendingDependencies,
      };
    }
  }

  return {
    allowed: true,
    blockingTasks: [],
  };
}

/**
 * Finds all tasks that directly depend on the specified task ID.
 */
export function getTasksDependentOn(taskId: string, allTasks: Task[]): Task[] {
  return allTasks.filter((t) => t.dependsOnTaskIds && t.dependsOnTaskIds.includes(taskId));
}

/**
 * Checks for circular dependency chains if adding candidateDependencyId to targetTaskId.
 */
export function wouldCreateCircularDependency(
  targetTaskId: string,
  candidateDependencyId: string,
  allTasks: Task[]
): boolean {
  if (targetTaskId === candidateDependencyId) return true;

  const visited = new Set<string>();
  const queue = [candidateDependencyId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (currentId === targetTaskId) return true;
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const currentTask = allTasks.find((t) => t.id === currentId);
    if (currentTask && currentTask.dependsOnTaskIds) {
      for (const nextId of currentTask.dependsOnTaskIds) {
        queue.push(nextId);
      }
    }
  }

  return false;
}
