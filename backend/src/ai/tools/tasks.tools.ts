import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { tasksService } from '../../services/tasks.service.js';

export function createTaskTools(userId: string) {
  const createTaskTool = new DynamicStructuredTool({
    name: 'create_task',
    description: 'Create a new task. Use this when the user wants to add a task, reminder, or todo item.',
    schema: z.object({
      title: z.string().describe('The title of the task'),
      description: z.string().optional().describe('Optional description or details'),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().describe('Task priority'),
      dueDate: z.string().optional().describe('Due date (e.g., "today", "tomorrow", "next week", "2024-12-25")'),
    }),
    func: async ({ title, description, priority, dueDate }) => {
      try {
        let parsedDueDate: Date | undefined;
        if (dueDate) {
          // Try parsing as ISO date first
          const isoDate = new Date(dueDate);
          if (!isNaN(isoDate.getTime())) {
            parsedDueDate = isoDate;
          } else {
            // Try natural language parsing
            parsedDueDate = tasksService.parseDueDate(dueDate);
          }
        }

        const task = await tasksService.create({
          userId,
          title,
          description,
          priority,
          dueDate: parsedDueDate,
        });

        return JSON.stringify({
          success: true,
          message: `Task "${title}" created successfully${parsedDueDate ? ` (due: ${parsedDueDate.toLocaleDateString()})` : ''}`,
          task: {
            id: task.id,
            title: task.title,
            priority: task.priority,
            dueDate: task.dueDate,
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

  const listTasksTool = new DynamicStructuredTool({
    name: 'list_tasks',
    description: 'List tasks, optionally filtered by status or priority. Use this when the user wants to see their tasks or todos.',
    schema: z.object({
      status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional().describe('Filter by status'),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().describe('Filter by priority'),
      limit: z.number().optional().default(10).describe('Maximum number of tasks to return'),
    }),
    func: async ({ status, priority, limit }) => {
      try {
        const result = await tasksService.list({
          userId,
          status,
          priority,
          limit,
        });

        if (result.tasks.length === 0) {
          return JSON.stringify({
            success: true,
            message: 'No tasks found matching the criteria.',
            tasks: [],
          });
        }

        return JSON.stringify({
          success: true,
          message: `Found ${result.total} task(s)`,
          tasks: result.tasks.map((t) => ({
            id: t.id,
            title: t.title,
            status: t.status,
            priority: t.priority,
            dueDate: t.dueDate,
          })),
          total: result.total,
        });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: (error as Error).message,
        });
      }
    },
  });

  const getTodayTasksTool = new DynamicStructuredTool({
    name: 'get_today_tasks',
    description: 'Get tasks due today or overdue. Use this when the user asks what they need to do today.',
    schema: z.object({}),
    func: async () => {
      try {
        const tasks = await tasksService.getTasksForToday(userId);

        if (tasks.length === 0) {
          return JSON.stringify({
            success: true,
            message: 'No tasks due today. You\'re all caught up!',
            tasks: [],
          });
        }

        const overdue = tasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date());
        const today = tasks.filter((t) => !t.dueDate || new Date(t.dueDate) >= new Date());

        return JSON.stringify({
          success: true,
          message: `You have ${tasks.length} task(s) for today${overdue.length > 0 ? ` (${overdue.length} overdue)` : ''}`,
          tasks: tasks.map((t) => ({
            id: t.id,
            title: t.title,
            status: t.status,
            priority: t.priority,
            dueDate: t.dueDate,
            isOverdue: t.dueDate && new Date(t.dueDate) < new Date(),
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

  const completeTaskTool = new DynamicStructuredTool({
    name: 'complete_task',
    description: 'Mark a task as completed. Use this when the user says they finished or completed a task.',
    schema: z.object({
      taskId: z.string().describe('The ID of the task to complete'),
    }),
    func: async ({ taskId }) => {
      try {
        const task = await tasksService.markComplete(taskId, userId);
        return JSON.stringify({
          success: true,
          message: `Task "${task.title}" marked as completed!`,
        });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: (error as Error).message,
        });
      }
    },
  });

  const updateTaskTool = new DynamicStructuredTool({
    name: 'update_task',
    description: 'Update an existing task. Use this when the user wants to modify a task.',
    schema: z.object({
      taskId: z.string().describe('The ID of the task to update'),
      title: z.string().optional().describe('New title'),
      description: z.string().optional().describe('New description'),
      status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional().describe('New status'),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().describe('New priority'),
      dueDate: z.string().optional().describe('New due date'),
    }),
    func: async ({ taskId, title, description, status, priority, dueDate }) => {
      try {
        let parsedDueDate: Date | undefined;
        if (dueDate) {
          const isoDate = new Date(dueDate);
          if (!isNaN(isoDate.getTime())) {
            parsedDueDate = isoDate;
          } else {
            parsedDueDate = tasksService.parseDueDate(dueDate);
          }
        }

        const task = await tasksService.update(taskId, userId, {
          title,
          description,
          status,
          priority,
          dueDate: parsedDueDate,
        });

        return JSON.stringify({
          success: true,
          message: `Task "${task.title}" updated successfully`,
          task: {
            id: task.id,
            title: task.title,
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate,
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

  const deleteTaskTool = new DynamicStructuredTool({
    name: 'delete_task',
    description: 'Delete a task. Use this when the user wants to remove a task.',
    schema: z.object({
      taskId: z.string().describe('The ID of the task to delete'),
    }),
    func: async ({ taskId }) => {
      try {
        await tasksService.delete(taskId, userId);
        return JSON.stringify({
          success: true,
          message: 'Task deleted successfully',
        });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: (error as Error).message,
        });
      }
    },
  });

  const getTaskStatsTool = new DynamicStructuredTool({
    name: 'get_task_stats',
    description: 'Get task statistics and summary. Use this when the user asks about their task progress or overview.',
    schema: z.object({}),
    func: async () => {
      try {
        const stats = await tasksService.getTaskStats(userId);
        return JSON.stringify({
          success: true,
          message: `Task Summary: ${stats.completed}/${stats.total} completed, ${stats.pending} pending, ${stats.inProgress} in progress${stats.overdue > 0 ? `, ${stats.overdue} overdue` : ''}`,
          stats,
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
    createTaskTool,
    listTasksTool,
    getTodayTasksTool,
    completeTaskTool,
    updateTaskTool,
    deleteTaskTool,
    getTaskStatsTool,
  ];
}
