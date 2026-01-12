import prisma from '../db/prisma.js';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface CreateTaskInput {
  userId: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date;
  goalId?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date | null;
  goalId?: string | null;
}

export interface TaskListParams {
  userId: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  goalId?: string;
  dueBefore?: Date;
  dueAfter?: Date;
  limit?: number;
  offset?: number;
}

export class TasksService {
  async create(input: CreateTaskInput) {
    const task = await prisma.task.create({
      data: {
        userId: input.userId,
        title: input.title,
        description: input.description,
        status: input.status || 'pending',
        priority: input.priority || 'medium',
        dueDate: input.dueDate,
        goalId: input.goalId,
      },
      include: {
        goal: true,
      },
    });

    return task;
  }

  async update(taskId: string, userId: string, input: UpdateTaskInput) {
    const existing = await prisma.task.findFirst({
      where: { id: taskId, userId },
    });

    if (!existing) {
      throw new Error('Task not found');
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: input.title,
        description: input.description,
        status: input.status,
        priority: input.priority,
        dueDate: input.dueDate,
        goalId: input.goalId,
      },
      include: {
        goal: true,
      },
    });

    return task;
  }

  async delete(taskId: string, userId: string) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, userId },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    await prisma.task.delete({ where: { id: taskId } });
    return { success: true };
  }

  async getById(taskId: string, userId: string) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, userId },
      include: {
        goal: true,
      },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    return task;
  }

  async list(params: TaskListParams) {
    const { userId, status, priority, goalId, dueBefore, dueAfter, limit = 50, offset = 0 } = params;

    const where: Record<string, unknown> = { userId };

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (goalId) where.goalId = goalId;

    if (dueBefore || dueAfter) {
      where.dueDate = {};
      if (dueBefore) (where.dueDate as Record<string, unknown>).lte = dueBefore;
      if (dueAfter) (where.dueDate as Record<string, unknown>).gte = dueAfter;
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [
        { dueDate: 'asc' },
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      skip: offset,
      include: {
        goal: true,
      },
    });

    const total = await prisma.task.count({ where });

    return { tasks, total };
  }

  async getTasksForToday(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasks = await prisma.task.findMany({
      where: {
        userId,
        status: { in: ['pending', 'in_progress'] },
        OR: [
          {
            dueDate: {
              gte: today,
              lt: tomorrow,
            },
          },
          {
            dueDate: {
              lt: today, // Overdue tasks
            },
          },
        ],
      },
      orderBy: [
        { dueDate: 'asc' },
        { priority: 'desc' },
      ],
      include: {
        goal: true,
      },
    });

    return tasks;
  }

  async getOverdueTasks(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return prisma.task.findMany({
      where: {
        userId,
        status: { in: ['pending', 'in_progress'] },
        dueDate: { lt: today },
      },
      orderBy: { dueDate: 'asc' },
      include: {
        goal: true,
      },
    });
  }

  async getTaskStats(userId: string) {
    const [total, completed, pending, inProgress, overdue] = await Promise.all([
      prisma.task.count({ where: { userId } }),
      prisma.task.count({ where: { userId, status: 'completed' } }),
      prisma.task.count({ where: { userId, status: 'pending' } }),
      prisma.task.count({ where: { userId, status: 'in_progress' } }),
      prisma.task.count({
        where: {
          userId,
          status: { in: ['pending', 'in_progress'] },
          dueDate: { lt: new Date() },
        },
      }),
    ]);

    return { total, completed, pending, inProgress, overdue };
  }

  async markComplete(taskId: string, userId: string) {
    return this.update(taskId, userId, { status: 'completed' });
  }

  // Parse natural language due dates
  parseDueDate(text: string): Date | undefined {
    const now = new Date();
    const lowered = text.toLowerCase();

    if (lowered.includes('today')) {
      return now;
    }

    if (lowered.includes('tomorrow')) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    }

    if (lowered.includes('next week')) {
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);
      return nextWeek;
    }

    // Match patterns like "in 3 days", "in 2 hours"
    const inPattern = /in (\d+) (day|days|hour|hours|week|weeks)/i;
    const inMatch = lowered.match(inPattern);
    if (inMatch) {
      const amount = parseInt(inMatch[1]);
      const unit = inMatch[2].toLowerCase();
      const date = new Date(now);

      if (unit.startsWith('day')) {
        date.setDate(date.getDate() + amount);
      } else if (unit.startsWith('hour')) {
        date.setHours(date.getHours() + amount);
      } else if (unit.startsWith('week')) {
        date.setDate(date.getDate() + amount * 7);
      }

      return date;
    }

    // Match day names
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    for (let i = 0; i < days.length; i++) {
      if (lowered.includes(days[i])) {
        const today = now.getDay();
        let daysUntil = i - today;
        if (daysUntil <= 0) daysUntil += 7;
        const date = new Date(now);
        date.setDate(date.getDate() + daysUntil);
        return date;
      }
    }

    return undefined;
  }
}

export const tasksService = new TasksService();
