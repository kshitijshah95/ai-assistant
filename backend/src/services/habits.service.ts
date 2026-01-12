import prisma from '../db/prisma.js';
import { Prisma } from '@prisma/client';

export type HabitFrequency = 'daily' | 'weekly' | 'custom';

export interface CreateHabitInput {
  userId: string;
  name: string;
  frequency?: HabitFrequency;
  schedule?: Record<string, unknown>;
}

export interface UpdateHabitInput {
  name?: string;
  frequency?: HabitFrequency;
  schedule?: Record<string, unknown>;
}

export class HabitsService {
  async create(input: CreateHabitInput) {
    const habit = await prisma.habit.create({
      data: {
        userId: input.userId,
        name: input.name,
        frequency: input.frequency || 'daily',
        schedule: (input.schedule || {}) as Prisma.InputJsonValue,
      },
    });

    return habit;
  }

  async update(habitId: string, userId: string, input: UpdateHabitInput) {
    const existing = await prisma.habit.findFirst({
      where: { id: habitId, userId },
    });

    if (!existing) {
      throw new Error('Habit not found');
    }

    const habit = await prisma.habit.update({
      where: { id: habitId },
      data: {
        name: input.name,
        frequency: input.frequency,
        schedule: input.schedule as Prisma.InputJsonValue | undefined,
      },
    });

    return habit;
  }

  async delete(habitId: string, userId: string) {
    const habit = await prisma.habit.findFirst({
      where: { id: habitId, userId },
    });

    if (!habit) {
      throw new Error('Habit not found');
    }

    await prisma.habit.delete({ where: { id: habitId } });
    return { success: true };
  }

  async getById(habitId: string, userId: string) {
    const habit = await prisma.habit.findFirst({
      where: { id: habitId, userId },
      include: {
        logs: {
          orderBy: { loggedDate: 'desc' },
          take: 30,
        },
      },
    });

    if (!habit) {
      throw new Error('Habit not found');
    }

    return habit;
  }

  async list(userId: string) {
    const habits = await prisma.habit.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        logs: {
          orderBy: { loggedDate: 'desc' },
          take: 7,
        },
      },
    });

    return habits.map((habit) => ({
      ...habit,
      streak: this.calculateStreak(habit.logs),
      completedToday: this.isCompletedToday(habit.logs),
    }));
  }

  async logHabit(habitId: string, userId: string, date?: Date, completed: boolean = true, notes?: string) {
    const habit = await prisma.habit.findFirst({
      where: { id: habitId, userId },
    });

    if (!habit) {
      throw new Error('Habit not found');
    }

    const logDate = date || new Date();
    logDate.setHours(0, 0, 0, 0);

    const log = await prisma.habitLog.upsert({
      where: {
        habitId_loggedDate: {
          habitId,
          loggedDate: logDate,
        },
      },
      create: {
        habitId,
        loggedDate: logDate,
        completed,
        notes,
      },
      update: {
        completed,
        notes,
      },
    });

    return log;
  }

  async getHabitLogs(habitId: string, userId: string, days: number = 30) {
    const habit = await prisma.habit.findFirst({
      where: { id: habitId, userId },
    });

    if (!habit) {
      throw new Error('Habit not found');
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const logs = await prisma.habitLog.findMany({
      where: {
        habitId,
        loggedDate: { gte: startDate },
      },
      orderBy: { loggedDate: 'desc' },
    });

    return logs;
  }

  async getHabitStats(habitId: string, userId: string) {
    const habit = await this.getById(habitId, userId);
    const logs = await this.getHabitLogs(habitId, userId, 30);

    const completedDays = logs.filter((l) => l.completed).length;
    const streak = this.calculateStreak(habit.logs);
    const completionRate = logs.length > 0 ? Math.round((completedDays / logs.length) * 100) : 0;

    return {
      streak,
      completedDays,
      totalDays: logs.length,
      completionRate,
    };
  }

  async getTodayStatus(userId: string) {
    const habits = await this.list(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return habits.map((habit) => ({
      id: habit.id,
      name: habit.name,
      completedToday: habit.completedToday,
      streak: habit.streak,
    }));
  }

  private calculateStreak(logs: { loggedDate: Date; completed: boolean }[]): number {
    if (logs.length === 0) return 0;

    const sortedLogs = [...logs].sort(
      (a, b) => new Date(b.loggedDate).getTime() - new Date(a.loggedDate).getTime()
    );

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const log of sortedLogs) {
      const logDate = new Date(log.loggedDate);
      logDate.setHours(0, 0, 0, 0);

      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - streak);

      if (logDate.getTime() === expectedDate.getTime() && log.completed) {
        streak++;
      } else if (logDate.getTime() < expectedDate.getTime()) {
        break;
      }
    }

    return streak;
  }

  private isCompletedToday(logs: { loggedDate: Date; completed: boolean }[]): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return logs.some((log) => {
      const logDate = new Date(log.loggedDate);
      logDate.setHours(0, 0, 0, 0);
      return logDate.getTime() === today.getTime() && log.completed;
    });
  }
}

export const habitsService = new HabitsService();
