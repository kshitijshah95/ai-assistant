import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { goalsService } from '../../services/goals.service.js';
import { tasksService } from '../../services/tasks.service.js';

export function createGoalTools(userId: string) {
  const createGoalTool = new DynamicStructuredTool({
    name: 'create_goal',
    description: 'Create a new goal. Use this when the user wants to set a long-term goal or objective.',
    schema: z.object({
      title: z.string().describe('The title of the goal'),
      description: z.string().optional().describe('Description of what the goal entails'),
      targetDate: z.string().optional().describe('Target date to achieve the goal'),
    }),
    func: async ({ title, description, targetDate }) => {
      try {
        const goal = await goalsService.create({
          userId,
          title,
          description,
          targetDate: targetDate ? new Date(targetDate) : undefined,
        });

        return JSON.stringify({
          success: true,
          message: `Goal "${title}" created successfully!`,
          goal: {
            id: goal.id,
            title: goal.title,
            targetDate: goal.targetDate,
          },
        });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: (error as Error).message,
        });
      }
    },
  });

  const listGoalsTool = new DynamicStructuredTool({
    name: 'list_goals',
    description: 'List all goals with their progress. Use this when the user asks about their goals.',
    schema: z.object({
      status: z.enum(['active', 'completed', 'archived']).optional().describe('Filter by status'),
    }),
    func: async ({ status }) => {
      try {
        const goals = await goalsService.list(userId, status);

        if (goals.length === 0) {
          return JSON.stringify({
            success: true,
            message: 'No goals found. Would you like to set a new goal?',
            goals: [],
          });
        }

        return JSON.stringify({
          success: true,
          message: `Found ${goals.length} goal(s)`,
          goals: goals.map((g) => ({
            id: g.id,
            title: g.title,
            status: g.status,
            progress: g.progress,
            targetDate: g.targetDate,
            taskCount: g.tasks.length,
          })),
        });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: (error as Error).message,
        });
      }
    },
  });

  const getGoalProgressTool = new DynamicStructuredTool({
    name: 'get_goal_progress',
    description: 'Get detailed progress on a specific goal. Use this when the user asks about progress on a goal.',
    schema: z.object({
      goalId: z.string().describe('The ID of the goal'),
    }),
    func: async ({ goalId }) => {
      try {
        const goal = await goalsService.getGoalWithProgress(goalId, userId);

        const completedTasks = goal.tasks.filter((t) => t.status === 'completed').length;
        const pendingTasks = goal.tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length;

        return JSON.stringify({
          success: true,
          message: `Goal "${goal.title}": ${goal.progress}% complete`,
          goal: {
            id: goal.id,
            title: goal.title,
            description: goal.description,
            status: goal.status,
            progress: goal.progress,
            targetDate: goal.targetDate,
            completedTasks,
            pendingTasks,
            tasks: goal.tasks.map((t) => ({
              id: t.id,
              title: t.title,
              status: t.status,
            })),
          },
        });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: (error as Error).message,
        });
      }
    },
  });

  const addTaskToGoalTool = new DynamicStructuredTool({
    name: 'add_task_to_goal',
    description: 'Add a task to help achieve a goal. Use this when breaking down a goal into actionable tasks.',
    schema: z.object({
      goalId: z.string().describe('The ID of the goal'),
      title: z.string().describe('The title of the task'),
      description: z.string().optional().describe('Task description'),
      dueDate: z.string().optional().describe('Due date for the task'),
    }),
    func: async ({ goalId, title, description, dueDate }) => {
      try {
        // Verify goal exists
        await goalsService.getById(goalId, userId);

        const task = await tasksService.create({
          userId,
          title,
          description,
          goalId,
          dueDate: dueDate ? new Date(dueDate) : undefined,
        });

        return JSON.stringify({
          success: true,
          message: `Task "${title}" added to the goal!`,
          task: {
            id: task.id,
            title: task.title,
          },
        });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: (error as Error).message,
        });
      }
    },
  });

  const updateGoalTool = new DynamicStructuredTool({
    name: 'update_goal',
    description: 'Update a goal. Use this when the user wants to modify a goal.',
    schema: z.object({
      goalId: z.string().describe('The ID of the goal'),
      title: z.string().optional().describe('New title'),
      description: z.string().optional().describe('New description'),
      status: z.enum(['active', 'completed', 'archived']).optional().describe('New status'),
    }),
    func: async ({ goalId, title, description, status }) => {
      try {
        const goal = await goalsService.update(goalId, userId, {
          title,
          description,
          status,
        });

        return JSON.stringify({
          success: true,
          message: `Goal "${goal.title}" updated successfully`,
        });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: (error as Error).message,
        });
      }
    },
  });

  return [
    createGoalTool,
    listGoalsTool,
    getGoalProgressTool,
    addTaskToGoalTool,
    updateGoalTool,
  ];
}
