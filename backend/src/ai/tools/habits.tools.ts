import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { habitsService } from '../../services/habits.service.js';

export function createHabitTools(userId: string) {
  const createHabitTool = new DynamicStructuredTool({
    name: 'create_habit',
    description: 'Create a new habit to track. Use this when the user wants to start tracking a new habit.',
    schema: z.object({
      name: z.string().describe('The name of the habit (e.g., "Morning meditation", "Read 30 minutes")'),
      frequency: z.enum(['daily', 'weekly']).optional().describe('How often the habit should be done'),
    }),
    func: async ({ name, frequency }) => {
      try {
        const habit = await habitsService.create({
          userId,
          name,
          frequency,
        });

        return JSON.stringify({
          success: true,
          message: `Habit "${name}" created! I'll help you track it ${frequency || 'daily'}.`,
          habit: {
            id: habit.id,
            name: habit.name,
            frequency: habit.frequency,
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

  const listHabitsTool = new DynamicStructuredTool({
    name: 'list_habits',
    description: 'List all habits with their current streaks. Use this when the user asks about their habits.',
    schema: z.object({}),
    func: async () => {
      try {
        const habits = await habitsService.list(userId);

        if (habits.length === 0) {
          return JSON.stringify({
            success: true,
            message: 'No habits being tracked yet. Would you like to start tracking a new habit?',
            habits: [],
          });
        }

        return JSON.stringify({
          success: true,
          message: `Tracking ${habits.length} habit(s)`,
          habits: habits.map((h) => ({
            id: h.id,
            name: h.name,
            streak: h.streak,
            completedToday: h.completedToday,
            frequency: h.frequency,
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

  const logHabitTool = new DynamicStructuredTool({
    name: 'log_habit',
    description: 'Log a habit as completed for today. Use this when the user says they did a habit.',
    schema: z.object({
      habitId: z.string().describe('The ID of the habit to log'),
      notes: z.string().optional().describe('Optional notes about the habit completion'),
    }),
    func: async ({ habitId, notes }) => {
      try {
        await habitsService.logHabit(habitId, userId, undefined, true, notes);
        const stats = await habitsService.getHabitStats(habitId, userId);

        return JSON.stringify({
          success: true,
          message: `Great job! Habit logged. Current streak: ${stats.streak} day(s)! 🔥`,
          stats: {
            streak: stats.streak,
            completionRate: stats.completionRate,
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

  const getTodayHabitsTool = new DynamicStructuredTool({
    name: 'get_today_habits',
    description: 'Get the status of habits for today. Use this to check which habits are done or pending.',
    schema: z.object({}),
    func: async () => {
      try {
        const status = await habitsService.getTodayStatus(userId);

        if (status.length === 0) {
          return JSON.stringify({
            success: true,
            message: 'No habits being tracked yet.',
            habits: [],
          });
        }

        const completed = status.filter((h) => h.completedToday);
        const pending = status.filter((h) => !h.completedToday);

        let message = '';
        if (pending.length === 0) {
          message = '🎉 All habits completed for today! Great job!';
        } else {
          message = `${completed.length}/${status.length} habits completed. ${pending.length} pending.`;
        }

        return JSON.stringify({
          success: true,
          message,
          completed: completed.map((h) => ({ id: h.id, name: h.name, streak: h.streak })),
          pending: pending.map((h) => ({ id: h.id, name: h.name, streak: h.streak })),
        });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: (error as Error).message,
        });
      }
    },
  });

  const getHabitStatsTool = new DynamicStructuredTool({
    name: 'get_habit_stats',
    description: 'Get detailed statistics for a specific habit. Use this when the user wants to see their habit progress.',
    schema: z.object({
      habitId: z.string().describe('The ID of the habit'),
    }),
    func: async ({ habitId }) => {
      try {
        const habit = await habitsService.getById(habitId, userId);
        const stats = await habitsService.getHabitStats(habitId, userId);

        return JSON.stringify({
          success: true,
          message: `Habit "${habit.name}": ${stats.streak} day streak, ${stats.completionRate}% completion rate`,
          habit: {
            id: habit.id,
            name: habit.name,
          },
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

  const deleteHabitTool = new DynamicStructuredTool({
    name: 'delete_habit',
    description: 'Delete a habit. Use this when the user wants to stop tracking a habit.',
    schema: z.object({
      habitId: z.string().describe('The ID of the habit to delete'),
    }),
    func: async ({ habitId }) => {
      try {
        await habitsService.delete(habitId, userId);
        return JSON.stringify({
          success: true,
          message: 'Habit deleted successfully',
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
    createHabitTool,
    listHabitsTool,
    logHabitTool,
    getTodayHabitsTool,
    getHabitStatsTool,
    deleteHabitTool,
  ];
}
